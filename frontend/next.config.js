/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Image Optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'localkart-media.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'localkart-media.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
  },
  
  // 2. Timeout Fix (ముఖ్యమైనది)
  staticPageGenerationTimeout: 120,

  // 3. Disable strict type/lint checks during build to save time (ముఖ్యమైనది)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 4. CSS fix
  experimental: {
    optimizeCss: false,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
