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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qkglxgyqionwvyolmodn.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
