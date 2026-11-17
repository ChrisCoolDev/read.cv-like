import { getCmsPostsWithContent, getCmsProfile } from "@/lib/notion";
import { buildRssFeedXml } from "@/lib/rss";

export async function GET() {
  const [profile, posts] = await Promise.all([
    getCmsProfile(),
    getCmsPostsWithContent(),
  ]);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || profile.site.url;
  const xml = buildRssFeedXml(profile, posts, baseUrl);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
