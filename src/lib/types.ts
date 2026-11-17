export interface Attachment {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface CaseStudyPreview {
  title: string;
  subtitle?: string;
  excerpt?: string;
  slug?: string;
  thumbnail?: string;
}

export interface CVSectionItem {
  id: string;
  duration: string;
  title: string;
  organization?: string;
  url?: string;
  location?: string;
  description?: string;
  hidden?: boolean;
  attachments?: Attachment[];
  caseStudy?: CaseStudyPreview;
}

export interface ContactItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  hidden?: boolean;
}

export interface ProfileStatus {
  enabled: boolean;
  emoji: string;
  text: string;
}

export interface SiteConfig {
  title: string;
  description: string;
  url: string;
  authorEmail?: string;
  rssTitle: string;
  rssDescription: string;
}

export interface ProfileData {
  name: string;
  handle: string;
  role: string;
  location: string;
  avatar: string;
  website: {
    label: string;
    url: string;
  };
  status: ProfileStatus;
  about: string;
  site: SiteConfig;
  sections: {
    workExperience: CVSectionItem[];
    freelance: CVSectionItem[];
    projects: CVSectionItem[];
    speaking: CVSectionItem[];
    sideProjects: CVSectionItem[];
    education: CVSectionItem[];
    reading: CVSectionItem[];
    travels: CVSectionItem[];
    contact: ContactItem[];
  };
}

export interface PostFrontmatter {
  title: string;
  subtitle?: string;
  date: string;
  published: boolean;
  tags: string[];
  featuredOnProfile?: boolean;
  coverImage?: string;
}

export interface PostSummary extends PostFrontmatter {
  slug: string;
  year: string;
  readingTime: string;
  wordCount: number;
  excerpt: string;
}

export interface Post extends PostSummary {
  content: string;
}
