import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Preview images are served from the public R2 domain (R2_PUBLIC_BASE_URL) when
// it is set; `next/image` refuses any host it doesn't recognise, so we allow
// that host here. Read at build time — set it in the Vercel project env so
// production builds pick it up.
const previewHost = process.env.R2_PUBLIC_BASE_URL
  ? new URL(process.env.R2_PUBLIC_BASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.156"],
  images: {
    // `pathname: "/**"` because URLs carry the bucket/key path (and, on the
    // presigned fallback, a query string we can't predict).
    remotePatterns: [
      // Public preview domain / CDN in front of the bucket — the fast path:
      // stable URLs the optimizer and browser can cache, free R2 egress.
      ...(previewHost
        ? [{ protocol: "https" as const, hostname: previewHost, pathname: "/**" }]
        : []),
      // Presigned S3 endpoint — fallback used until the public domain is set.
      {
        protocol: "https" as const,
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
    ],
  },
};

// Points next-intl at src/i18n/request.ts and enables the compile-time bits.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
