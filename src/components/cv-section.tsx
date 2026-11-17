import Image from "next/image";
import Link from "next/link";
import type { CVSectionItem } from "@/lib/types";
import { AttachmentGallery } from "./attachment-gallery";

interface CVSectionProps {
  id: string;
  title: string;
  items: CVSectionItem[];
  headerAction?: React.ReactNode;
}

export function CVSection({
  id,
  title,
  items,
  headerAction,
}: CVSectionProps) {
  const visibleItems = items.filter((item) => !item.hidden);
  if (!visibleItems.length) return null;

  return (
    <section id={id} className="flex w-full flex-col items-start pt-[60px]">
      <div className="flex w-full items-center justify-between gap-4">
        <h2 className="text-[14px] font-normal leading-[26px] tracking-[0.021px] text-[#111111]">
          {title}
        </h2>
        {headerAction}
      </div>

      <div className="flex w-full flex-col">
        {visibleItems.map((item, idx) => {
          const fullTitle = item.organization
            ? `${item.title} at ${item.organization}`
            : item.title;

          const isInternal = item.url?.startsWith("/");

          return (
            <article
              key={item.id}
              className={`flex w-full flex-col sm:flex-row sm:items-start ${
                idx === 0 ? "pt-[24px]" : "pt-[36px]"
              }`}
            >
              <div className="shrink-0 sm:w-[124.5px] sm:pr-[36px]">
                <p className="text-[14px] leading-[1.6] tracking-[0.021px] text-[#999999]">
                  {item.duration}
                </p>
              </div>

              <div className="min-w-0 flex-1 pb-[12px] sm:max-w-[415.5px]">
                <div className="text-[14px] leading-[1.6] tracking-[0.021px] text-[#111111]">
                  {item.url ? (
                    isInternal ? (
                      <Link
                        href={item.url}
                        className="text-[#111111] underline decoration-transparent underline-offset-[3px] transition-colors hover:decoration-[#999999]"
                      >
                        {fullTitle}
                      </Link>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#111111] underline decoration-transparent underline-offset-[3px] transition-colors hover:decoration-[#999999]"
                      >
                        {fullTitle}
                      </a>
                    )
                  ) : (
                    <span>{fullTitle}</span>
                  )}
                </div>

                {item.location && (
                  <p className="text-[14px] leading-[1.6] tracking-[0.021px] text-[#555555]">
                    {item.location}
                  </p>
                )}

                {item.description && (
                  <p className="mt-1 text-[14px] leading-[1.6] tracking-[0.021px] text-[#555555]">
                    {item.description}
                  </p>
                )}

                {item.attachments && item.attachments.length > 0 && (
                  <AttachmentGallery attachments={item.attachments} />
                )}

                {item.caseStudy && item.caseStudy.slug && (
                  <Link
                    href={`/writing/${item.caseStudy.slug}`}
                    className="group mt-3 flex items-center gap-3 rounded-[10px] border border-[#e5e5e5] bg-[#f6f6f6] p-2.5 transition-colors hover:bg-[#efefef]"
                  >
                    {item.caseStudy.thumbnail && (
                      <Image
                        src={item.caseStudy.thumbnail}
                        alt={item.caseStudy.title}
                        width={64}
                        height={48}
                        className="h-12 w-16 shrink-0 rounded-[6px] border border-[#e5e5e5] object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-[#111111]">
                        {item.caseStudy.title}
                      </p>
                      {item.caseStudy.excerpt && (
                        <p className="line-clamp-2 text-[12.5px] leading-[1.45] text-[#555555]">
                          {item.caseStudy.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
