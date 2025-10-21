import type { NextConfig } from 'next';

const nextConfig = {
  experimental: {
    cacheComponents: true,
  },
} satisfies NextConfig;

export default nextConfig;
