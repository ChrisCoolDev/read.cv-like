import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Rss } from "lucide-react";
import { WritingIndex } from "@/components/writing-index";
import { getCmsPosts, getCmsProfile } from "@/lib/notion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays, notes, and case studies.",
};

export default async function WritingPage() {
  const [profile, posts] = await Promise.all([
    getCmsProfile(),
    getCmsPosts(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[636px] px-[24px] py-[24px] sm:px-[48px] sm:py-[72px]">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#999999] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{profile.name}</span>
        </Link>

        <a
          href="/rss.xml"
          className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#f6f6f6] px-3 text-[12px] text-[#555555] transition-colors hover:bg-[#efefef] hover:text-[#111111]"
        >
          <Rss className="h-3 w-3" />
          <span>RSS</span>
        </a>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-[20px] font-normal leading-[1.3] tracking-[-0.1px] text-[#111111]">
          Writing
        </h1>
        <p className="text-[14px] leading-[1.6] text-[#555555]">
          {profile.site.rssDescription}
        </p>
      </header>

      <WritingIndex posts={posts} />
    </div>
  );
}
