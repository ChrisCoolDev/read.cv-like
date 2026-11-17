import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[636px] flex-col justify-center px-[24px] py-[48px] sm:px-[48px]">
      <p className="text-[13px] text-[#999999]">404</p>
      <h1 className="mt-1 text-[20px] font-normal tracking-[-0.1px] text-[#111111]">
        Page not found
      </h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-[#555555]">
        This page may have been moved or unpublished.
      </p>
      <div className="mt-6 flex items-center gap-4 text-[13.5px]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#111111] underline decoration-[#e5e5e5] underline-offset-3 hover:decoration-[#111111]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to profile</span>
        </Link>
        <Link
          href="/writing"
          className="text-[#555555] transition-colors hover:text-[#111111]"
        >
          Browse writing
        </Link>
      </div>
    </div>
  );
}
