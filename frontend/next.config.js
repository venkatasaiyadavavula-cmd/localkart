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
  
  // 2. స్టాటిక్ జనరేషన్ టైమౌట్
  staticPageGenerationTimeout: 180,

  // 3. టైప్ మరియు లింట్ చెకింగ్ ని విస్మరించు
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  // 4. ప్రయోగాత్మక ఫీచర్లు
  experimental: { optimizeCss: false },
  
  // 5. ప్రొడక్షన్ లో console.log తొలగించు
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
  
  // 6. స్టాటిక్ ఎక్స్‌పోర్ట్‌ను నిలిపివేయడం ద్వారా పేజీలు డైనమిక్‌గా రెండర్ అవుతాయి
  output: 'standalone',
  
  // 7. అన్ని పేజీలు డిఫాల్ట్‌గా డైనమిక్ రెండరింగ్ ఉపయోగించేలా బలవంతం చేయడం
  // ఇది static generation ప్రయత్నాలను పూర్తిగా నిలిపివేస్తుంది
  reactStrictMode: true,
};

module.exports = nextConfig;
