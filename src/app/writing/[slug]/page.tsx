import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Rss } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/mdx-components";
import { getCmsPostBySlug, getCmsPosts, getCmsProfile } from "@/lib/notion";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getCmsPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/writing/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCmsPostBySlug(slug);
  if (!post) {
    return { title: "Article not found" };
  }

  return {
    title: post.title,
    description: post.subtitle || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.subtitle || post.excerpt,
      type: "article",
      publishedTime: post.date,
    },
  };
}

async function CompiledMdxBody({ source }: { source: string }) {
  return (
    <div className="prose-readcv">
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
          },
        }}
      />
    </div>
  );
}

export default async function ArticlePage({
  params,
}: PageProps<"/writing/[slug]">) {
  const { slug } = await params;
  const [post, profile, allPosts] = await Promise.all([
    getCmsPostBySlug(slug),
    getCmsProfile(),
    getCmsPosts(),
  ]);

  if (!post) {
    notFound();
  }

  const currentIndex = allPosts.findIndex((p) => p.slug === post.slug);
  const newerPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const olderPost =
    currentIndex >= 0 && currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : null;

  return (
    <article className="mx-auto w-full max-w-[636px] px-[24px] py-[24px] sm:px-[48px] sm:py-[72px]">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-[13px] text-[#999999]">
          <Link
            href="/writing"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[#111111]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Writing</span>
          </Link>
          <span>/</span>
          <Link href="/" className="transition-colors hover:text-[#111111]">
            {profile.name}
          </Link>
        </div>

        <a
          href="/rss.xml"
          className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#f6f6f6] px-3 text-[12px] text-[#555555] transition-colors hover:bg-[#efefef] hover:text-[#111111]"
        >
          <Rss className="h-3 w-3" />
          <span>RSS</span>
        </a>
      </div>

      <header className="mb-10 flex flex-col gap-3 border-b border-black/8 pb-8">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#999999]">
          <time dateTime={post.date} className="tabular-nums">
            {post.date}
          </time>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        <h1 className="text-[22px] font-medium leading-[1.3] tracking-[-0.02em] text-[#111111] sm:text-[24px]">
          {post.title}
        </h1>

        {post.subtitle && (
          <p className="text-[15px] leading-[1.55] text-[#555555]">
            {post.subtitle}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#f6f6f6] px-2.5 py-0.5 text-[11.5px] text-[#555555]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <CompiledMdxBody source={post.content} />

      <footer className="mt-14 border-t border-black/8 pt-8">
        <div className="flex flex-col gap-6">
          {(newerPost || olderPost) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {newerPost ? (
                <Link
                  href={`/writing/${newerPost.slug}`}
                  className="group rounded-[12px] border border-[#e5e5e5] p-3.5 transition-colors hover:bg-[#f6f6f6]"
                >
                  <p className="text-[11.5px] text-[#999999]">Newer</p>
                  <p className="mt-0.5 line-clamp-1 text-[13.5px] font-medium text-[#111111]">
                    {newerPost.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}

              {olderPost && (
                <Link
                  href={`/writing/${olderPost.slug}`}
                  className="group rounded-[12px] border border-[#e5e5e5] p-3.5 text-left transition-colors hover:bg-[#f6f6f6] sm:text-right"
                >
                  <p className="text-[11.5px] text-[#999999]">Older</p>
                  <p className="mt-0.5 line-clamp-1 text-[13.5px] font-medium text-[#111111]">
                    {olderPost.title}
                  </p>
                </Link>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[#f6f6f6] px-4 py-3 text-[13px] text-[#555555]">
            <span>Written by {profile.name}</span>
            <a
              href="/rss.xml"
              className="inline-flex items-center gap-1.5 text-[#111111] underline decoration-[#e5e5e5] underline-offset-3 hover:decoration-[#111111]"
            >
              <Rss className="h-3.5 w-3.5" />
              <span>Subscribe via RSS</span>
            </a>
          </div>
        </div>
      </footer>
    </article>
  );
}
