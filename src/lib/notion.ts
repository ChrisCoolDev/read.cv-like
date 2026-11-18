import {
  getAllPosts as getLocalPosts,
  getAllPostsWithContent as getLocalPostsWithContent,
  getPostBySlug as getLocalPostBySlug,
  slugify,
} from "./posts";
import { getProfile as getLocalProfile } from "./profile";
import type {
  Attachment,
  ContactItem,
  CVSectionItem,
  Post,
  PostSummary,
  ProfileData,
} from "./types";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const DEFAULT_CMS_PAGE_ID = "38ada6fa597d8072a41ad21c86c191ad";

const DEFAULT_DB_IDS = {
  profile: "41ada6fa597d81de93f9d0c6e78e1418",
  workExperience: "41bda6fa597d81869ed6c558213a8b93",
  freelance: "41bda6fa597d81db863ec3e18f999a1c",
  writing: "38ada6fa597d80888a16cffaf95284b9",
  speaking: "41bda6fa597d8153ba86da8d372b840f",
  sideProjects: "41bda6fa597d8136b6f8f076e3745b77",
  education: "41bda6fa597d81cdb4a3c23c0a8ce081",
  reading: "41bda6fa597d8119bca6d3ab8c2886a7",
  travels: "41bda6fa597d81b3904ce7a5f2becffd",
  contact: "41bda6fa597d81948d5de3bbe275d20c",
};

interface NotionRichTextItem {
  plain_text: string;
  href: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
}

interface NotionFileItem {
  name?: string;
  type: "external" | "file";
  external?: { url: string };
  file?: { url: string };
}

interface NotionPropertyValue {
  type: string;
  title?: NotionRichTextItem[];
  rich_text?: NotionRichTextItem[];
  url?: string | null;
  number?: number | null;
  checkbox?: boolean;
  select?: { name: string } | null;
  multi_select?: { name: string }[];
  date?: { start: string; end?: string | null } | null;
  files?: NotionFileItem[];
}

interface NotionPage {
  id: string;
  created_time: string;
  properties: Record<string, NotionPropertyValue>;
}

interface NotionBlock {
  id: string;
  type: string;
  child_database?: {
    title: string;
  };
  [key: string]: unknown;
}

interface DiscoveredDatabases {
  profile: string;
  workExperience: string;
  freelance: string;
  writing: string;
  speaking: string;
  sideProjects: string;
  education: string;
  reading: string;
  travels: string;
  contact: string;
}

function getNotionToken(): string | null {
  const token = process.env.NOTION_API_KEY?.trim();
  return token ? token : null;
}

async function notionFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  const token = getNotionToken();
  if (!token) return null;

  try {
    const res = await fetch(`${NOTION_API_BASE}${endpoint}`, {
      ...options,
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function discoverSectionDatabases(): Promise<DiscoveredDatabases> {
  const result: DiscoveredDatabases = { ...DEFAULT_DB_IDS };
  const cmsPageId =
    process.env.NOTION_CMS_PAGE_ID?.trim() || DEFAULT_CMS_PAGE_ID;

  if (!getNotionToken() || !cmsPageId) {
    return result;
  }

  const children = await notionFetch<{ results: NotionBlock[] }>(
    `/blocks/${cmsPageId}/children?page_size=100`
  );

  for (const block of children?.results ?? []) {
    if (block.type !== "child_database" || !block.child_database?.title) {
      continue;
    }
    const title = block.child_database.title.trim().toLowerCase();
    if (title.includes("profile")) {
      result.profile = block.id;
    } else if (title.includes("work")) {
      result.workExperience = block.id;
    } else if (title.includes("freelance")) {
      result.freelance = block.id;
    } else if (title.includes("writing") || title.includes("blog")) {
      result.writing = block.id;
    } else if (title.includes("speaking")) {
      result.speaking = block.id;
    } else if (title.includes("side")) {
      result.sideProjects = block.id;
    } else if (title.includes("education")) {
      result.education = block.id;
    } else if (title.includes("reading") || title.includes("lecture")) {
      result.reading = block.id;
    } else if (
      title.includes("travel") ||
      title.includes("activit") ||
      title.includes("voyage")
    ) {
      result.travels = block.id;
    } else if (title.includes("contact")) {
      result.contact = block.id;
    }
  }

  return result;
}

async function queryPublishedOrderedRows(
  databaseId: string
): Promise<NotionPage[] | null> {
  const res = await notionFetch<{ results: NotionPage[] }>(
    `/databases/${databaseId}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          property: "Published",
          checkbox: { equals: true },
        },
        sorts: [{ property: "Order", direction: "ascending" }],
        page_size: 100,
      }),
    }
  );
  return res?.results ?? null;
}

function readPlainText(prop?: NotionPropertyValue): string {
  if (!prop) return "";
  if (prop.type === "title" && Array.isArray(prop.title)) {
    return prop.title.map((t) => t.plain_text).join("").trim();
  }
  if (prop.type === "rich_text" && Array.isArray(prop.rich_text)) {
    return prop.rich_text.map((t) => t.plain_text).join("").trim();
  }
  if (prop.type === "url") {
    return prop.url?.trim() ?? "";
  }
  if (prop.type === "select") {
    return prop.select?.name?.trim() ?? "";
  }
  return "";
}

function richTextToMarkdown(items?: NotionRichTextItem[]): string {
  if (!Array.isArray(items)) return "";
  return items
    .map((item) => {
      let text = item.plain_text;
      if (!text) return "";
      const ann = item.annotations;
      if (ann?.code) {
        text = `\`${text}\``;
      } else {
        if (ann?.bold) text = `**${text}**`;
        if (ann?.italic) text = `*${text}*`;
        if (ann?.strikethrough) text = `~~${text}~~`;
      }
      if (item.href) {
        text = `[${text}](${item.href})`;
      }
      return text;
    })
    .join("");
}

function blocksToMarkdown(blocks: NotionBlock[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const data = block[block.type] as
      | {
          rich_text?: NotionRichTextItem[];
          language?: string;
          caption?: NotionRichTextItem[];
          type?: string;
          external?: { url: string };
          file?: { url: string };
          checked?: boolean;
        }
      | undefined;

    switch (block.type) {
      case "paragraph":
        lines.push(richTextToMarkdown(data?.rich_text));
        break;
      case "heading_1":
        lines.push(`# ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "heading_2":
        lines.push(`## ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "heading_3":
        lines.push(`### ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "bulleted_list_item":
        lines.push(`- ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "numbered_list_item":
        lines.push(`1. ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "to_do":
        lines.push(
          `- [${data?.checked ? "x" : " "}] ${richTextToMarkdown(data?.rich_text)}`
        );
        break;
      case "quote":
        lines.push(`> ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "callout":
        lines.push(`> ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "code": {
        const lang = data?.language || "";
        const code = data?.rich_text?.map((t) => t.plain_text).join("") ?? "";
        lines.push(`\`\`\`${lang}\n${code}\n\`\`\``);
        break;
      }
      case "divider":
        lines.push("---");
        break;
      case "image": {
        const url =
          data?.type === "external"
            ? data.external?.url
            : data?.file?.url || "";
        const caption = richTextToMarkdown(data?.caption);
        if (url) {
          lines.push(`![${caption}](${url})`);
        }
        break;
      }
      default:
        break;
    }
  }

  return lines.join("\n\n").trim();
}

function extractAttachments(
  filesProp?: NotionPropertyValue,
  urlsProp?: NotionPropertyValue
): Attachment[] | undefined {
  const result: Attachment[] = [];

  if (filesProp?.type === "files" && Array.isArray(filesProp.files)) {
    for (const f of filesProp.files) {
      const src = f.type === "file" ? f.file?.url : f.external?.url;
      if (src) {
        result.push({
          id: `att-${result.length + 1}`,
          src,
          alt: f.name || `Attachment ${result.length + 1}`,
        });
      }
    }
  }

  const rawUrls = readPlainText(urlsProp);
  if (rawUrls) {
    for (const src of rawUrls
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      result.push({
        id: `att-${result.length + 1}`,
        src,
        alt: `Attachment ${result.length + 1}`,
      });
    }
  }

  return result.length > 0 ? result : undefined;
}

export async function getCmsProfile(): Promise<ProfileData> {
  const fallback = getLocalProfile();
  if (!getNotionToken()) {
    return fallback;
  }

  const dbs = await discoverSectionDatabases();

  const [
    profileRes,
    workRows,
    freelanceRows,
    speakingRows,
    sideProjectRows,
    educationRows,
    readingRows,
    travelsRows,
    contactRows,
  ] = await Promise.all([
    notionFetch<{ results: NotionPage[] }>(
      `/databases/${dbs.profile}/query`,
      {
        method: "POST",
        body: JSON.stringify({ page_size: 1 }),
      }
    ),
    queryPublishedOrderedRows(dbs.workExperience),
    queryPublishedOrderedRows(dbs.freelance),
    queryPublishedOrderedRows(dbs.speaking),
    queryPublishedOrderedRows(dbs.sideProjects),
    queryPublishedOrderedRows(dbs.education),
    queryPublishedOrderedRows(dbs.reading),
    queryPublishedOrderedRows(dbs.travels),
    queryPublishedOrderedRows(dbs.contact),
  ]);

  if (
    !profileRes &&
    !workRows &&
    !freelanceRows &&
    !speakingRows &&
    !sideProjectRows &&
    !educationRows &&
    !readingRows &&
    !travelsRows &&
    !contactRows
  ) {
    return fallback;
  }

  const headerPage = profileRes?.results?.[0];
  const name =
    readPlainText(headerPage?.properties?.Name) || fallback.name;
  const subtitle = readPlainText(headerPage?.properties?.Subtitle);
  const websiteLabel =
    readPlainText(headerPage?.properties?.WebsiteLabel) ||
    fallback.website.label;
  const websiteUrl =
    readPlainText(headerPage?.properties?.WebsiteURL) || fallback.website.url;
  const avatar =
    readPlainText(headerPage?.properties?.Avatar) || fallback.avatar;
  const about = readPlainText(headerPage?.properties?.About) || fallback.about;
  const siteUrl =
    readPlainText(headerPage?.properties?.SiteURL) || fallback.site.url;

  const workExperience: CVSectionItem[] = (workRows ?? [])
    .map((row) => ({
      id: row.id,
      duration: readPlainText(row.properties.Duration),
      title: readPlainText(row.properties.Role),
      organization: readPlainText(row.properties.Company) || undefined,
      location: readPlainText(row.properties.Location) || undefined,
      description: readPlainText(row.properties.Description) || undefined,
      url: readPlainText(row.properties.Link) || undefined,
      attachments: extractAttachments(
        row.properties.Attachments,
        row.properties.AttachmentURLs
      ),
    }))
    .filter((item) => Boolean(item.title));

  const freelance: CVSectionItem[] = (freelanceRows ?? [])
    .map((row) => ({
      id: row.id,
      duration: readPlainText(row.properties.Duration),
      title: readPlainText(row.properties.Role),
      organization: readPlainText(row.properties.Client) || undefined,
      location: readPlainText(row.properties.Location) || undefined,
      description: readPlainText(row.properties.Description) || undefined,
      url: readPlainText(row.properties.Link) || undefined,
      attachments: extractAttachments(
        row.properties.Attachments,
        row.properties.AttachmentURLs
      ),
    }))
    .filter((item) => Boolean(item.title));

  const speaking: CVSectionItem[] = (speakingRows ?? [])
    .map((row) => ({
      id: row.id,
      duration: readPlainText(row.properties.Duration),
      title: readPlainText(row.properties.Title),
      location: readPlainText(row.properties.Location) || undefined,
      url: readPlainText(row.properties.Link) || undefined,
    }))
    .filter((item) => Boolean(item.title));

  const sideProjects: CVSectionItem[] = (sideProjectRows ?? [])
    .map((row) => ({
      id: row.id,
      duration: readPlainText(row.properties.Duration),
      title: readPlainText(row.properties.Title),
      description: readPlainText(row.properties.Description) || undefined,
      url: readPlainText(row.properties.Link) || undefined,
      attachments: extractAttachments(
        row.properties.Attachments,
        row.properties.AttachmentURLs
      ),
    }))
    .filter((item) => Boolean(item.title));

  const education: CVSectionItem[] = (educationRows ?? [])
    .map((row) => ({
      id: row.id,
      duration: readPlainText(row.properties.Duration),
      title: readPlainText(row.properties.Degree),
      organization: readPlainText(row.properties.School) || undefined,
      location: readPlainText(row.properties.Location) || undefined,
      url: readPlainText(row.properties.Link) || undefined,
    }))
    .filter((item) => Boolean(item.title));

  const reading: CVSectionItem[] = (readingRows ?? [])
    .map((row) => ({
      id: row.id,
      duration:
        readPlainText(row.properties.Year) ||
        readPlainText(row.properties.Status) ||
        "Reading",
      title: readPlainText(row.properties.Title),
      location: readPlainText(row.properties.Author) || undefined,
      description: readPlainText(row.properties.Notes) || undefined,
      url: readPlainText(row.properties.Link) || undefined,
    }))
    .filter((item) => Boolean(item.title));

  const travels: CVSectionItem[] = (travelsRows ?? [])
    .map((row) => ({
      id: row.id,
      duration: readPlainText(row.properties.Duration),
      title: readPlainText(row.properties.Title),
      location: readPlainText(row.properties.Location) || undefined,
      description: readPlainText(row.properties.Description) || undefined,
      url: readPlainText(row.properties.Link) || undefined,
      attachments: extractAttachments(
        row.properties.Attachments,
        row.properties.AttachmentURLs
      ),
    }))
    .filter((item) => Boolean(item.title));

  const contact: ContactItem[] = (contactRows ?? [])
    .map((row) => ({
      id: row.id,
      platform: readPlainText(row.properties.Platform),
      label: readPlainText(row.properties.Handle) || "username",
      url: readPlainText(row.properties.Link) || "#",
    }))
    .filter((item) => Boolean(item.platform));

  return {
    ...fallback,
    name,
    role: subtitle || `${fallback.role} in ${fallback.location}`,
    location: "",
    avatar,
    website: {
      label: websiteLabel,
      url: websiteUrl,
    },
    about,
    site: {
      ...fallback.site,
      title: name,
      description: about,
      url: siteUrl,
      rssTitle: `${name} — Writing`,
    },
    sections: {
      workExperience:
        workRows !== null ? workExperience : fallback.sections.workExperience,
      freelance:
        freelanceRows !== null ? freelance : fallback.sections.freelance,
      projects: [],
      speaking: speakingRows !== null ? speaking : fallback.sections.speaking,
      sideProjects:
        sideProjectRows !== null
          ? sideProjects
          : fallback.sections.sideProjects,
      education:
        educationRows !== null ? education : fallback.sections.education,
      reading: readingRows !== null ? reading : fallback.sections.reading,
      travels: travelsRows !== null ? travels : fallback.sections.travels,
      contact: contactRows !== null ? contact : fallback.sections.contact,
    },
  };
}

function mapNotionPageToPostSummary(page: NotionPage): PostSummary {
  const props = page.properties;
  const title = readPlainText(props.Title) || "Untitled";
  const rawSlug = readPlainText(props.Slug);
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  const subtitle = readPlainText(props.Excerpt) || undefined;
  const date =
    props.Date?.date?.start || page.created_time.slice(0, 10) || "2023-01-01";
  const year = date.slice(0, 4);
  const tag = readPlainText(props.Tag);
  const tags = tag ? [tag] : [];
  const readTimeNum =
    typeof props.ReadTime?.number === "number" && props.ReadTime.number > 0
      ? props.ReadTime.number
      : 3;
  const coverImage = readPlainText(props.Cover) || undefined;

  return {
    slug,
    title,
    subtitle,
    date,
    year,
    published: props.Published?.checkbox ?? true,
    tags,
    featuredOnProfile: true,
    coverImage,
    readingTime: `${readTimeNum} min read`,
    wordCount: readTimeNum * 220,
    excerpt: subtitle || "",
  };
}

export async function getCmsPosts(): Promise<PostSummary[]> {
  const fallback = getLocalPosts({ includeDrafts: false });
  if (!getNotionToken()) {
    return fallback;
  }

  const dbs = await discoverSectionDatabases();
  const res = await notionFetch<{ results: NotionPage[] }>(
    `/databases/${dbs.writing}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          property: "Published",
          checkbox: { equals: true },
        },
        sorts: [{ property: "Date", direction: "descending" }],
        page_size: 100,
      }),
    }
  );

  if (!res || !res.results.length) {
    return fallback;
  }

  return res.results.map(mapNotionPageToPostSummary);
}

export async function getCmsPostBySlug(slug: string): Promise<Post | null> {
  if (!getNotionToken()) {
    return getLocalPostBySlug(slug, { includeDrafts: false });
  }

  const dbs = await discoverSectionDatabases();
  const res = await notionFetch<{ results: NotionPage[] }>(
    `/databases/${dbs.writing}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Published", checkbox: { equals: true } },
            { property: "Slug", rich_text: { equals: slug } },
          ],
        },
        page_size: 1,
      }),
    }
  );

  const page = res?.results?.[0];
  if (!page) {
    return getLocalPostBySlug(slug, { includeDrafts: false });
  }

  const summary = mapNotionPageToPostSummary(page);
  const blocksRes = await notionFetch<{ results: NotionBlock[] }>(
    `/blocks/${page.id}/children?page_size=100`
  );

  const markdown = blocksRes?.results
    ? blocksToMarkdown(blocksRes.results)
    : "";

  return {
    ...summary,
    content:
      markdown ||
      getLocalPostBySlug(slug, { includeDrafts: false })?.content ||
      "",
  };
}

export async function getCmsPostsWithContent(): Promise<Post[]> {
  if (!getNotionToken()) {
    return getLocalPostsWithContent({ includeDrafts: false });
  }

  const summaries = await getCmsPosts();
  const fullPosts = await Promise.all(
    summaries.map(async (s) => {
      const full = await getCmsPostBySlug(s.slug);
      return (
        full ?? {
          ...s,
          content: s.subtitle || s.title,
        }
      );
    })
  );
  return fullPosts;
}
