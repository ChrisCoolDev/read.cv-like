/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

interface CalloutProps {
  title?: string;
  children: React.ReactNode;
}

export function Callout({ title, children }: CalloutProps) {
  return (
    <aside className="my-6 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3.5 text-[13.5px] leading-[1.6] text-[var(--text-2)]">
      {title && (
        <p className="mb-1 font-medium text-[var(--text-1)]">{title}</p>
      )}
      <div className="[&>p]:my-1 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
}

function MdxLink({
  href = "",
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function MdxImage({
  src,
  alt,
  ...props
}: ComponentPropsWithoutRef<"img">) {
  return (
    <figure className="my-6">
      <img
        src={src}
        alt={alt || ""}
        className="w-full rounded-[10px] border border-[var(--border)] object-cover"
        {...props}
      />
      {alt && (
        <figcaption className="mt-2 text-center text-[12px] text-[var(--text-3)]">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

export const mdxComponents = {
  a: MdxLink,
  img: MdxImage,
  Callout,
};
