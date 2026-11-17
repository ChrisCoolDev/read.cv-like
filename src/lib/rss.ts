import type { Post, ProfileData } from "./types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeCdata(value: string): string {
  return value.replace(/]]>/g, "]]]]><![CDATA[>");
}

function toRfc822Date(dateString: string): string {
  const parsed = new Date(`${dateString}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return "Thu, 01 Jan 2026 12:00:00 GMT";
  }
  return parsed.toUTCString();
}

function formatInline(text: string): string {
  return escapeXml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2">$1</a>'
    );
}

function markdownToSimpleHtml(markdown: string): string {
  const blocks = markdown
    .replace(/```[\s\S]*?```/g, (block) => {
      const inner = block.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "");
      return `<pre><code>${escapeXml(inner)}</code></pre>`;
    })
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      if (block.startsWith("<pre>")) return block;
      if (block.startsWith("### ")) {
        return `<h3>${formatInline(block.slice(4))}</h3>`;
      }
      if (block.startsWith("## ")) {
        return `<h2>${formatInline(block.slice(3))}</h2>`;
      }
      if (block.startsWith("# ")) {
        return `<h1>${formatInline(block.slice(2))}</h1>`;
      }
      if (block.startsWith("> ")) {
        return `<blockquote><p>${formatInline(block.replace(/^>\s?/gm, ""))}</p></blockquote>`;
      }
      const lines = block.split("\n");
      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        const items = lines
          .map((line) => `<li>${formatInline(line.replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        const items = lines
          .map((line) => `<li>${formatInline(line.replace(/^\d+\.\s+/, ""))}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }
      return `<p>${formatInline(block)}</p>`;
    })
    .join("\n");
}

export function buildRssFeedXml(
  profile: ProfileData,
  posts: Post[],
  baseUrl?: string
): string {
  const siteUrl = (baseUrl || profile.site.url || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
  const feedUrl = `${siteUrl}/rss.xml`;
  const lastBuildDate =
    posts.length > 0
      ? toRfc822Date(posts[0].date)
      : "Thu, 01 Jan 2026 12:00:00 GMT";

  const itemsXml = posts
    .map((post) => {
      const postUrl = `${siteUrl}/writing/${post.slug}`;
      const categoriesXml = post.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");
      const htmlContent = markdownToSimpleHtml(post.content);

      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(postUrl)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>`,
        `      <pubDate>${toRfc822Date(post.date)}</pubDate>`,
        `      <description>${escapeXml(post.subtitle || post.excerpt)}</description>`,
        categoriesXml,
        `      <content:encoded><![CDATA[${escapeCdata(htmlContent)}]]></content:encoded>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    "  <channel>",
    `    <title>${escapeXml(profile.site.rssTitle || `${profile.name} — Writing`)}</title>`,
    `    <link>${escapeXml(siteUrl)}</link>`,
    `    <description>${escapeXml(profile.site.rssDescription || profile.about)}</description>`,
    "    <language>en</language>",
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    itemsXml,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
