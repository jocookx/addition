import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "Addition Academy | AI and Digital Design Learning Platform",
    template: "%s | ADDITION",
  },
  description:
    "Learn AI and Digital Design workflows: prompting, Rhino, Grasshopper, Revit, Dynamo, Twinmotion, Unreal Engine, Adobe and AI.",
  keywords: ["AI and Digital Design", "Rhino", "Grasshopper", "Revit", "Dynamo", "Twinmotion", "Unreal Engine", "Adobe", "AI", "architectural digital design", "command library"],
  openGraph: {
    siteName: "ADDITION",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
