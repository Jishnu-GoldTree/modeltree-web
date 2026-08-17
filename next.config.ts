import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.156"],
  images: {
    // Preview images live in R2, fetched over the S3-compatible endpoint via
    // signed URLs. `next/image` refuses any host it doesn't know, so this has
    // to enumerate the R2 endpoint. `pathname: "/**"` because signed URLs
    // include the bucket/key path and a query string we can't predict.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
    ],
  },
};

// Points next-intl at src/i18n/request.ts and enables the compile-time bits.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
