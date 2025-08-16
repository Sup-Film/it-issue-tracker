import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint checks during production build to avoid failing the build
    // (prefer fixing lint errors in dev workflow)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
