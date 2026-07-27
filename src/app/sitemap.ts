import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const staticRoutes = [
  "",
  "/auth",
  "/catalog",
  "/commands",
  "/combos",
  "/learn",
  "/paths",
  "/practice",
  "/privacy",
  "/refunds",
  "/resources",
  "/search",
  "/skills",
  "/terms",
  "/toolkit",
  "/workshops",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
