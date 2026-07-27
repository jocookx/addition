import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MobileShell } from "@/components/mobile-shell";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Extend content into the notch / Dynamic Island area so we can
  // draw our own header behind the status bar (handled via safe-area CSS)
  viewportFit: "cover",
  // Chrome/Android address-bar theme colour
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Addition Academy | AI and Digital Design Learning Platform",
    template: "%s | ADDITION",
  },
  description:
    "Learn AI and Digital Design workflows: prompting, Rhino, Grasshopper, Revit, Dynamo, Twinmotion, Unreal Engine, Adobe and AI.",
  keywords: [
    "AI and Digital Design",
    "Rhino",
    "Grasshopper",
    "Revit",
    "Dynamo",
    "Twinmotion",
    "Unreal Engine",
    "Adobe",
    "AI",
    "architectural digital design",
    "command library",
  ],
  openGraph: {
    siteName: "ADDITION",
    type: "website",
  },
  // iOS home-screen web-app behaviour
  appleWebApp: {
    capable: true,
    title: "Addition",
    statusBarStyle: "black-translucent",
  },
  // Android manifest
  manifest: "/manifest.webmanifest",
  // Disable automatic phone-number detection
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
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
        <MobileShell />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
