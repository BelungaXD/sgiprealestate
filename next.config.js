/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config.js');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Exclude test files from being treated as pages
  pageExtensions: ['page.tsx', 'page.ts', 'tsx', 'ts', 'api.ts', 'api.tsx'],
  i18n: {
    ...i18n,
    localeDetection: false,
  },
  images: {
    domains: ['localhost', 'sgiprealestate.alfares.cz', 'sgiprealestate.com', 'sgiprealestate.ru', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimize for production
  productionBrowserSourceMaps: false,
  // Reduce bundle size
  webpack: (config, { dev, isServer }) => {
    // Exclude test files from build using webpack IgnorePlugin
    const webpack = require('webpack')
    
    // Ignore all test and spec files
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource) {
          // Ignore files with .test. or .spec. in the name
          if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(resource)) {
            return true
          }
          // Ignore files in __tests__ directories
          if (resource.includes('__tests__')) {
            return true
          }
          return false
        },
      })
    )
    
    if (!dev && !isServer) {
      // Remove react-refresh in production
    }
    return config
  },
  experimental: {
    // optimizeCss: true, // Disabled due to critters dependency issue
  },
  // Enable standalone output for Docker
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
