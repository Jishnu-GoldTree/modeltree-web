import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
};

// Points next-intl at src/i18n/request.ts and enables the compile-time bits.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
