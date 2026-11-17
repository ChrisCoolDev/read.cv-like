import type { MetadataRoute } from "next";
import { getCmsPosts, getCmsProfile } from "@/lib/notion";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profile, posts] = await Promise.all([
    getCmsProfile(),
    getCmsPosts(),
  ]);
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    profile.site.url ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");

  return [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/writing`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...posts.map((post) => ({
      url: `${baseUrl}/writing/${post.slug}`,
      lastModified: new Date(`${post.date}T12:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
