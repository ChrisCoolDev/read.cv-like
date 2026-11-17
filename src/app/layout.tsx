import type { Metadata } from "next";
import { Golos_Text, JetBrains_Mono } from "next/font/google";
import { getCmsProfile } from "@/lib/notion";
import "./globals.css";

const golosText = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getCmsProfile();
  return {
    title: {
      default: profile.site.title,
      template: `%s — ${profile.name}`,
    },
    description: profile.site.description,
    alternates: {
      types: {
        "application/rss+xml": [
          {
            url: "/rss.xml",
            title: profile.site.rssTitle,
          },
        ],
      },
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${golosText.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-white text-[#111111] antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
