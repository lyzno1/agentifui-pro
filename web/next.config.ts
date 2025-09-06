import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    // Set workspace root to resolve monorepo lockfile warning
    root: require("path").resolve(__dirname, "../"),
  },
  // Production optimizations: remove console logs except errors
  ...(process.env.NODE_ENV === "production" && {
    compiler: {
      removeConsole: {
        exclude: ["error", "warn"], // Keep console.error and console.warn in production
      },
    },
  }),
};

// Conditionally enable bundle analyzer (only when not using Turbopack)
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true" && !process.env.TURBOPACK,
});

// Use Turbopack mode when TURBOPACK env var is set, otherwise use standard mode with bundle analyzer
export default process.env.TURBOPACK
  ? withNextIntl(nextConfig)
  : withNextIntl(withBundleAnalyzer(nextConfig));
