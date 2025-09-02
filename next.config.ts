import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Do not fail production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Do not fail production builds on type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
