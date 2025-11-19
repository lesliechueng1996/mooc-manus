import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // issue https://github.com/vercel/next.js/issues/86099
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
};

export default nextConfig;
