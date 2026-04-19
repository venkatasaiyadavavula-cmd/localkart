/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. ఇమేజ్ ఆప్టిమైజేషన్ కోసం అనుమతించబడిన URLలు
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'localkart-media.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'localkart-media.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
  },
  
  // 2. స్టాటిక్ పేజీ జనరేషన్ మరియు డేటా ఫెచింగ్ టైమౌట్‌ను 2 నిమిషాలకు పెంచడం
  staticPageGenerationTimeout: 120,

  // 3. టైప్‌స్క్రిప్ట్ మరియు లింటింగ్ ఎర్రర్లను బిల్డ్ సమయంలో విస్మరించడం
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 4. CSS ఆప్టిమైజేషన్ ప్రయోగాన్ని నిలిపివేయడం
  experimental: {
    optimizeCss: false,
  },
  
  // 5. ప్రొడక్షన్ లో కన్సోల్ లాగ్స్ తొలగించడం
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 6. ఇది స్టాటిక్ ఎక్స్‌పోర్ట్ (SSG) ను నిలిపివేస్తుంది. పేజీలు సర్వర్-సైడ్ (SSR) లేదా క్లయింట్-సైడ్ (CSR) లో రెండర్ అవుతాయి.
  output: 'standalone',
};

module.exports = nextConfig;
