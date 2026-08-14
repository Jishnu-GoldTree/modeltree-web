import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.156'],
};

// Points next-intl at src/i18n/request.ts and enables the compile-time bits.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
