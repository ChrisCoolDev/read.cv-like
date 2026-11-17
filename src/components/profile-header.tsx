import Image from "next/image";
import type { ProfileData } from "@/lib/types";

interface ProfileHeaderProps {
  profile: ProfileData;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const subtitle = profile.location
    ? `${profile.role} in ${profile.location}`
    : profile.role;

  return (
    <header className="flex w-full flex-col items-start">
      <div className="flex w-full items-center gap-[16px]">
        <div className="relative h-[92px] w-[92px] shrink-0">
          <Image
            src={profile.avatar}
            alt={profile.name}
            width={92}
            height={92}
            priority
            className="h-[92px] w-[92px] rounded-full object-cover"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start gap-[3px]">
          <h1 className="text-[20px] font-normal leading-[1.3] tracking-[-0.1px] text-[#111111]">
            {profile.name}
          </h1>
          {subtitle && (
            <p className="text-[14px] font-normal leading-[1.6] tracking-[0.021px] text-[#555555]">
              {subtitle}
            </p>
          )}
          {profile.website?.label && (
            <a
              href={profile.website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[24px] items-center justify-center rounded-[12px] bg-[#f6f6f6] px-[10px] text-[12px] leading-none text-[#555555] transition-colors hover:bg-[#efefef] hover:text-[#111111]"
            >
              {profile.website.label}
            </a>
          )}
        </div>
      </div>

      {profile.about && (
        <div className="flex w-full flex-col items-start gap-[2px] pt-[36px]">
          <h2 className="h-[26px] text-[14px] font-normal leading-[26px] tracking-[0.021px] text-[#111111]">
            About
          </h2>
          <p className="text-[14px] font-normal leading-[1.6] tracking-[0.021px] text-[#555555]">
            {profile.about}
          </p>
        </div>
      )}
    </header>
  );
}
