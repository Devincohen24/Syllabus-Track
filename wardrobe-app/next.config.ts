import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'openweathermap.org' },
    ],
  },
  serverExternalPackages: ['googleapis'],
};

export default nextConfig;
