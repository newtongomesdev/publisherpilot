import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  output: "standalone",
  serverExternalPackages: ["chromadb", "@chroma-core/default-embed"],
};

export default nextConfig;
