import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import LandingPage from "./LandingPage";
import "./landing.css";

const description =
  "Learn AI and Digital Design through short courses, searchable commands, guided learning paths and live workshops for architecture students and designers.";

export const metadata: Metadata = {
  title: "Addition Academy | AI and Digital Design Learning Platform",
  description,
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "ADDITION",
    url: `${SITE_URL}/`,
    title: "Addition Academy | AI and Digital Design Learning Platform",
    description,
    images: [
      {
        url: `${SITE_URL}/og-image.svg`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Addition Academy | AI and Digital Design Learning Platform",
    description,
    images: [`${SITE_URL}/og-image.svg`],
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            description:
              "AI and Digital Design learning platform with courses, searchable commands, guided paths and live workshops.",
            foundingDate: "2025",
            founder: { "@type": "Person", name: "Jo Cook" },
          }),
        }}
      />
      <LandingPage />
    </>
  );
}
