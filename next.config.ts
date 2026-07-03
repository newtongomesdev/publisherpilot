import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  output: "standalone",
  serverExternalPackages: ["chromadb", "@chroma-core/default-embed"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: false,
    outputFileTracingExcludes: {
      "/api/**": ["**/*.md"],
    },
  },
};

export default nextConfig;
