import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — only allow framing by same origin
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop browsers guessing content types (MIME-sniffing attacks)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't send full URL in Referer header to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser feature access
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  // Enable browser DNS prefetching for performance (safe)
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
