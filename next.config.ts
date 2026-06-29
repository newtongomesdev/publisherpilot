import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["chromadb", "@chroma-core/default-embed"],
};

export default nextConfig;
