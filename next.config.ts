import type { NextConfig } from "next";

// Content-Security-Policy:
//  - default-src 'self'            — only load resources from own origin by default
//  - script-src 'unsafe-inline'    — required by Next.js App Router hydration scripts
//  - style-src  'unsafe-inline'    — required for CSS-in-JS / global style tags
//  - connect-src wss:              — Supabase real-time channels use WebSockets
//  - object-src 'none'             — block Flash / plugin injection
//  - base-uri   'self'             — prevent base-tag hijacking
//  - form-action 'self' + stripe   — restrict where forms may POST
//  - frame-ancestors 'self'        — supersedes X-Frame-Options in modern browsers
//
// Note: nonce-based script-src (removing 'unsafe-inline') can be added later via
// Next.js middleware and the experimental.csp option.
const isDev = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline'",
  [
    "img-src 'self' data: blob:",
    "https://*.supabase.co",
    "https://*.supabase.in",
    "https://placehold.co",
    "https://images.unsplash.com",
    // Cloudflare Stream thumbnails
    "https://videodelivery.net",
    "https://cloudflarestream.com",
    "https://*.cloudflarestream.com",
    "https://i.ytimg.com",
  ].join(" "),
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "https://*.supabase.in",
    "wss://*.supabase.co",
    "wss://*.supabase.in",
    "https://api.stripe.com",
    "https://checkout.stripe.com",
    // Cloudflare Stream TUS upload endpoint + API
    "https://api.cloudflare.com",
    "https://upload.videodelivery.net",
    "https://*.cloudflarestream.com",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
  ].join(" "),
  [
    "frame-src",
    "https://js.stripe.com",
    "https://checkout.stripe.com",
    "https://buy.stripe.com",
    // Cloudflare Stream player iframe
    "https://iframe.cloudflarestream.com",
    "https://cloudflarestream.com",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
  ].join(" "),
  "font-src 'self' data:",
  [
    "media-src 'self' blob:",
    "https://*.supabase.co",
    "https://*.supabase.in",
    // CF Stream HLS/DASH media segments
    "https://videodelivery.net",
    "https://*.cloudflarestream.com",
  ].join(" "),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://buy.stripe.com",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  // Prevent clickjacking — only allow framing by same origin
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop browsers guessing content types (MIME-sniffing attacks)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't send full URL in Referer header to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser feature access
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // Enable browser DNS prefetching for performance (safe)
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Enforce HTTPS for 2 years; include subdomains
  // Note: only effective over HTTPS — harmless over HTTP in local dev
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Content Security Policy
  { key: "Content-Security-Policy", value: CSP },
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
