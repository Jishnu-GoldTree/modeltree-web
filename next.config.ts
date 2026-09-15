import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /**
   * Static and dynamic per component rather than per route. Without it any
   * cookie read or `searchParams` access anywhere in a tree forces the whole
   * route to be server-rendered per request — which is how a catalogue of
   * public, rarely-changing listings ended up with nothing prerendered at all.
   * With it, the shell prerenders and only the viewer-specific parts stream.
   */
  cacheComponents: true,
  allowedDevOrigins: ["192.168.0.156"],
  images: {
    // Custom loader: serve images straight from R2 / /public instead of paying
    // for Vercel's Image Optimization. See src/lib/image-loader.ts. A custom
    // loader also bypasses the built-in host allowlist, so no `remotePatterns`
    // are needed — the loader is trusted to build every URL.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
};

// Points next-intl at src/i18n/request.ts and enables the compile-time bits.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
