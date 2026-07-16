import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained build at .next/standalone (server.js + minimal
  // node_modules) so the Docker image stays small and needs no install step.
  output: "standalone",
};

export default nextConfig;
