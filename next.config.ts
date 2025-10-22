import type { NextConfig } from 'next';

const nextConfig = {
  experimental: {
    cacheComponents: false,
  },
} satisfies NextConfig;

export default nextConfig;
