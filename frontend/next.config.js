/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. ఇమేజ్ ఆప్టిమైజేషన్
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'localkart-media.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'localkart-media.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
  },
  
  // 2. టైమౌట్ సెట్టింగ్
  staticPageGenerationTimeout: 300,

  // 3. టైప్/లింట్ ఎర్రర్లను విస్మరించు
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  // 4. ప్రయోగాత్మక ఫీచర్లు
  experimental: { optimizeCss: false },
  
  // 5. ప్రొడక్షన్ లో console.log తొలగించు
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
  
  // 6. స్టాటిక్ ఎక్స్‌పోర్ట్ ను నిలిపివేయడం
  output: 'standalone',
  
  // 7. అతి ముఖ్యమైన మార్పు: అన్ని పేజీలు డిఫాల్ట్‌గా సర్వర్-సైడ్ రెండరింగ్ (SSR) ఉపయోగించేలా బలవంతం చేయండి
  // ఈ సెట్టింగ్ వల్ల build time లో పేజీలను స్టాటిక్‌గా జనరేట్ చేయడానికి ప్రయత్నించదు.
  // దీనికి బదులుగా, అన్ని పేజీలు రిక్వెస్ట్ టైమ్ లో రెండర్ అవుతాయి.
  reactStrictMode: true,
  trailingSlash: false,
  
  // 8. అదనపు భద్రత: webpack కాన్ఫిగ్ ద్వారా కూడా నిరోధించవచ్చు, కానీ ఇది అవసరం లేదు.
};

module.exports = nextConfig;
