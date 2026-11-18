import Link from "next/link";
import { CVSection } from "@/components/cv-section";
import { ProfileHeader } from "@/components/profile-header";
import { getCmsPosts, getCmsProfile } from "@/lib/notion";

export const revalidate = 60;

export default async function HomePage() {
  const [profile, posts] = await Promise.all([
    getCmsProfile(),
    getCmsPosts(),
  ]);

  const writingItems = posts
    .filter((post) => post.featuredOnProfile !== false)
    .map((post) => ({
      id: `post-${post.slug}`,
      duration: post.year,
      title: post.title,
      url: `/writing/${post.slug}`,
      location: post.subtitle,
    }));

  const visibleContacts = profile.sections.contact.filter(
    (item) => !item.hidden
  );

  return (
    <div className="mx-auto flex w-full max-w-[636px] flex-col px-[24px] py-[24px] sm:px-[48px] sm:py-[72px]">
      <ProfileHeader profile={profile} />

      <CVSection
        id="education"
        title="Education"
        items={profile.sections.education}
      />

      <CVSection
        id="work-experience"
        title="Work Experience"
        items={profile.sections.workExperience}
      />

      <CVSection
        id="freelance"
        title="Freelance"
        items={profile.sections.freelance}
      />

      <CVSection
        id="writing"
        title="Writing"
        items={writingItems}
        headerAction={
          <div className="flex items-center gap-3 text-[12px] text-[#999999]">
            <Link
              href="/writing"
              className="transition-colors hover:text-[#111111]"
            >
              All
            </Link>
            <a
              href="/rss.xml"
              className="transition-colors hover:text-[#111111]"
            >
              RSS
            </a>
          </div>
        }
      />

      <CVSection
        id="speaking"
        title="Speaking"
        items={profile.sections.speaking}
      />

      <CVSection
        id="side-projects"
        title="Side Projects"
        items={profile.sections.sideProjects}
      />

      

      <CVSection
        id="reading"
        title="Reading"
        items={profile.sections.reading}
      />

      <CVSection
        id="travels"
        title="Travels & Activities"
        items={profile.sections.travels}
      />

      {visibleContacts.length > 0 && (
        <section
          id="contact"
          className="flex w-full flex-col items-start pt-[60px]"
        >
          <h2 className="text-[14px] font-normal leading-[26px] tracking-[0.021px] text-[#111111]">
            Contact
          </h2>

          <div className="flex w-full flex-col">
            {visibleContacts.map((item, idx) => {
              const isInternal = item.url.startsWith("/");
              return (
                <div
                  key={item.id}
                  className={`flex w-full flex-col sm:flex-row sm:items-start ${
                    idx === 0 ? "pt-[24px] pb-[8px]" : "py-[8px]"
                  }`}
                >
                  <div className="shrink-0 sm:w-[124.5px] sm:pr-[36px]">
                    <span className="text-[14px] leading-[1.6] tracking-[0.021px] text-[#999999]">
                      {item.platform}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {isInternal ? (
                      <Link
                        href={item.url}
                        className="text-[14px] leading-[1.6] tracking-[0.021px] text-[#111111] underline decoration-transparent underline-offset-[3px] transition-colors hover:decoration-[#999999]"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#111111] text-[14px] leading-[1.6] tracking-[0.021px] underline decoration-transparent underline-offset-[3px] transition-colors hover:decoration-[#999999]"
                      >
                        {item.label}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
