import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Post, PostFrontmatter, PostSummary } from "./types";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function ensurePostsDir(): void {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMarkdownForExcerpt(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>-]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateReadingTime(text: string): {
  readingTime: string;
  wordCount: number;
} {
  const clean = stripMarkdownForExcerpt(text);
  const words = clean ? clean.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return {
    readingTime: `${minutes} min read`,
    wordCount: words,
  };
}

function normalizeFrontmatter(
  rawData: Record<string, unknown>,
  slug: string
): PostFrontmatter {
  const title =
    typeof rawData.title === "string" && rawData.title.trim()
      ? rawData.title.trim()
      : slug;
  const subtitle =
    typeof rawData.subtitle === "string" && rawData.subtitle.trim()
      ? rawData.subtitle.trim()
      : undefined;
  const date =
    typeof rawData.date === "string" && rawData.date.trim()
      ? rawData.date.trim()
      : "2026-01-01";
  const published =
    typeof rawData.published === "boolean" ? rawData.published : true;
  const featuredOnProfile =
    typeof rawData.featuredOnProfile === "boolean"
      ? rawData.featuredOnProfile
      : true;
  const tags = Array.isArray(rawData.tags)
    ? rawData.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];
  const coverImage =
    typeof rawData.coverImage === "string" && rawData.coverImage.trim()
      ? rawData.coverImage.trim()
      : undefined;

  return {
    title,
    subtitle,
    date,
    published,
    tags,
    featuredOnProfile,
    coverImage,
  };
}

function parsePostFile(filePath: string, slug: string): Post {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = normalizeFrontmatter(data, slug);
  const { readingTime, wordCount } = calculateReadingTime(content);
  const plain = stripMarkdownForExcerpt(content);
  const excerpt =
    frontmatter.subtitle ||
    (plain.length > 160 ? `${plain.slice(0, 157)}...` : plain);
  const year = frontmatter.date.slice(0, 4) || "2026";

  return {
    slug,
    year,
    readingTime,
    wordCount,
    excerpt,
    content: content.trim(),
    ...frontmatter,
  };
}

export function getAllPosts(options?: {
  includeDrafts?: boolean;
}): PostSummary[] {
  try {
    if (!fs.existsSync(POSTS_DIR)) {
      return [];
    }
    const includeDrafts = options?.includeDrafts ?? false;
    const files = fs
      .readdirSync(POSTS_DIR)
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));

    return files
      .map((file) => {
        const slug = file.replace(/\.(mdx|md)$/, "");
        const post = parsePostFile(path.join(POSTS_DIR, file), slug);
        // Omit full content in summary list to keep payloads light
        const { content: _content, ...summary } = post;
        void _content;
        return summary;
      })
      .filter((post) => includeDrafts || post.published)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } catch {
    return [];
  }
}

export function getAllPostsWithContent(options?: {
  includeDrafts?: boolean;
}): Post[] {
  try {
    if (!fs.existsSync(POSTS_DIR)) {
      return [];
    }
    const includeDrafts = options?.includeDrafts ?? false;
    const files = fs
      .readdirSync(POSTS_DIR)
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));

    return files
      .map((file) => {
        const slug = file.replace(/\.(mdx|md)$/, "");
        return parsePostFile(path.join(POSTS_DIR, file), slug);
      })
      .filter((post) => includeDrafts || post.published)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } catch {
    return [];
  }
}

export function getPostBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Post | null {
  if (!isValidSlug(slug)) {
    return null;
  }

  try {
    if (!fs.existsSync(POSTS_DIR)) {
      return null;
    }
    const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
    const mdPath = path.join(POSTS_DIR, `${slug}.md`);
    const targetPath = fs.existsSync(mdxPath)
      ? mdxPath
      : fs.existsSync(mdPath)
        ? mdPath
        : null;

    if (!targetPath) {
      return null;
    }

    const post = parsePostFile(targetPath, slug);
    if (!post.published && !(options?.includeDrafts ?? false)) {
      return null;
    }
    return post;
  } catch {
    return null;
  }
}

export function savePost(input: {
  slug: string;
  previousSlug?: string;
  title: string;
  subtitle?: string;
  date: string;
  published: boolean;
  tags: string[];
  featuredOnProfile?: boolean;
  coverImage?: string;
  content: string;
}): Post {
  const cleanSlug = slugify(input.slug || input.title);
  if (!isValidSlug(cleanSlug)) {
    throw new Error("Invalid slug. Use lowercase letters, numbers, and hyphens.");
  }

  ensurePostsDir();

  if (
    input.previousSlug &&
    input.previousSlug !== cleanSlug &&
    isValidSlug(input.previousSlug)
  ) {
    const oldPath = path.join(POSTS_DIR, `${input.previousSlug}.mdx`);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const frontmatter: Record<string, unknown> = {
    title: input.title.trim() || "Untitled",
    date: input.date.trim() || "2026-01-01",
    published: Boolean(input.published),
    featuredOnProfile: input.featuredOnProfile ?? true,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
  };

  if (input.subtitle?.trim()) {
    frontmatter.subtitle = input.subtitle.trim();
  }
  if (input.coverImage?.trim()) {
    frontmatter.coverImage = input.coverImage.trim();
  }

  const fileContent = matter.stringify(`${input.content.trim()}\n`, frontmatter);
  const targetPath = path.join(POSTS_DIR, `${cleanSlug}.mdx`);
  fs.writeFileSync(targetPath, fileContent, "utf-8");

  return parsePostFile(targetPath, cleanSlug);
}

export function deletePost(slug: string): boolean {
  if (!isValidSlug(slug)) {
    return false;
  }
  ensurePostsDir();
  const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
  const mdPath = path.join(POSTS_DIR, `${slug}.md`);

  if (fs.existsSync(mdxPath)) {
    fs.unlinkSync(mdxPath);
    return true;
  }
  if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
    return true;
  }
  return false;
}
