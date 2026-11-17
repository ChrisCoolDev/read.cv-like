"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Attachment } from "@/lib/types";

interface AttachmentGalleryProps {
  attachments: Attachment[];
}

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedIndex(null);
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev === null ? null : (prev + 1) % attachments.length
        );
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + attachments.length) % attachments.length
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, attachments.length]);

  if (!attachments.length) return null;

  const active = selectedIndex !== null ? attachments[selectedIndex] : null;

  return (
    <>
      <div className="no-scrollbar mt-3 flex gap-[8px] overflow-x-auto pb-1">
        {attachments.map((att, index) => (
          <button
            key={att.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className="group relative h-[90px] w-[160px] shrink-0 overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] transition-transform duration-150 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--text-3)]"
            aria-label={att.alt || "Open attachment preview"}
          >
            <Image
              src={att.src}
              alt={att.alt}
              width={160}
              height={90}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
        >
          <div
            className="relative flex max-h-[90vh] max-w-[820px] flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative overflow-hidden rounded-[12px] border border-white/15 bg-black">
              <Image
                src={active.src}
                alt={active.alt}
                width={1200}
                height={800}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>

            <div className="flex w-full items-center justify-between gap-4 text-[13px] text-white/80">
              <span>{active.caption || active.alt}</span>
              {attachments.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedIndex((prev) =>
                        prev === null
                          ? 0
                          : (prev - 1 + attachments.length) % attachments.length
                      )
                    }
                    className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                    aria-label="Previous attachment"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[12px] tabular-nums text-white/60">
                    {(selectedIndex ?? 0) + 1} / {attachments.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedIndex((prev) =>
                        prev === null ? 0 : (prev + 1) % attachments.length
                      )
                    }
                    className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                    aria-label="Next attachment"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
