/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'localkart-media.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'localkart-media.s3.ap-south-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
      },
    ],
  },
  experimental: {
    optimizeCss: false, // Disabled to fix Vercel build timeout
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
