import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'bullmq',
    'ioredis',
    'nodejieba',
    'officeparser',
    '@mapbox/node-pre-gyp',
    'pg',
    'pg-native',
  ],
};

export default nextConfig;
