import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/mouse',
        destination: '/mouse.html',
      },
      {
        source: '/mouse/showcase',
        destination: '/mouse/showcase.html',
      },
    ];
  },
};

export default nextConfig;
