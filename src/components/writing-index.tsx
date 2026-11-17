"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { PostSummary } from "@/lib/types";

interface WritingIndexProps {
  posts: PostSummary[];
}

export function WritingIndex({ posts }: WritingIndexProps) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (selectedTag && !post.tags.includes(selectedTag)) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        post.title,
        post.subtitle,
        post.excerpt,
        post.tags.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [posts, query, selectedTag]);

  return (
    <div className="w-full">
      {/* Search & Tag Filters */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--text-3)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter articles by title or topic..."
            className="h-9 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)]/60 pl-9 pr-8 text-[13.5px] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--text-3)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              className="absolute right-2.5 rounded p-0.5 text-[var(--text-3)] hover:text-[var(--text-1)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-2.5 py-1 text-[12px] transition-colors ${
                selectedTag === null
                  ? "bg-[var(--text-1)] text-[var(--bg)]"
                  : "bg-[var(--surface-elevated)] text-[var(--text-2)] hover:text-[var(--text-1)]"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTag((prev) => (prev === tag ? null : tag))
                }
                className={`rounded-full px-2.5 py-1 text-[12px] transition-colors ${
                  selectedTag === tag
                    ? "bg-[var(--text-1)] text-[var(--bg)]"
                    : "bg-[var(--surface-elevated)] text-[var(--text-2)] hover:text-[var(--text-1)]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Article List — 2-column Read.cv layout */}
      <div className="mt-8 flex flex-col">
        {filteredPosts.length === 0 ? (
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)]/40 px-5 py-8 text-center text-[13.5px] text-[var(--text-3)]">
            No articles match your current filter.
          </div>
        ) : (
          filteredPosts.map((post, idx) => (
            <article
              key={post.slug}
              className={`flex w-full flex-col sm:flex-row sm:items-start ${
                idx === 0 ? "pt-2" : "pt-[32px]"
              }`}
            >
              <div className="shrink-0 sm:w-[124.5px] sm:pr-[36px]">
                <time
                  dateTime={post.date}
                  className="text-[14px] leading-[1.6] tabular-nums text-[var(--text-3)]"
                >
                  {post.date}
                </time>
              </div>

              <div className="min-w-0 flex-1 sm:max-w-[415.5px]">
                <Link
                  href={`/writing/${post.slug}`}
                  className="group block focus:outline-none"
                >
                  <h2 className="text-[14.5px] font-medium leading-[1.5] text-[var(--text-1)] underline decoration-transparent underline-offset-[3px] transition-colors group-hover:decoration-[var(--text-3)]">
                    {post.title}
                  </h2>
                  {(post.subtitle || post.excerpt) && (
                    <p className="mt-0.5 text-[14px] leading-[1.6] text-[var(--text-2)]">
                      {post.subtitle || post.excerpt}
                    </p>
                  )}
                </Link>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-3)]">
                  <span>{post.readingTime}</span>
                  {post.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {post.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setSelectedTag((prev) =>
                                prev === tag ? null : tag
                              )
                            }
                            className="rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 text-[11.5px] text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
