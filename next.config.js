/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config.js');

// Optional bundle analyzer - only use if installed and ANALYZE is enabled
let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
  } catch (e) {
    // Bundle analyzer not installed, skip it
    console.warn('@next/bundle-analyzer not found, skipping bundle analysis');
  }
}

// Use assetPrefix only when explicitly set for CDN. Do NOT use NEXT_PUBLIC_SITE_URL here:
// if set to https://sgipreal.com, users on https://www.sgipreal.com would request
// chunks/data from non-www → cross-origin → CORS "access control checks" failure.
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || ''

const nextConfig = {
  ...(assetPrefix && { assetPrefix }),
  reactStrictMode: true,
  swcMinify: true,
  // Exclude test files from being treated as pages
  pageExtensions: ['page.tsx', 'page.ts', 'tsx', 'ts', 'api.ts', 'api.tsx'],
  i18n: {
    ...i18n,
    localeDetection: false,
  },
  images: {
    domains: [
      'localhost',
      'sgiprealestate.alfares.cz',
      'sgipreal.com',
      'sgipreal.ru',
      'sgipreality.statex.cz',
      'images.unsplash.com',
      // Add server domain from environment variable if set
      ...(process.env.NEXT_PUBLIC_SERVER_URL
        ? (() => {
            try {
              return [new URL(process.env.NEXT_PUBLIC_SERVER_URL).hostname]
            } catch (e) {
              console.warn('Invalid NEXT_PUBLIC_SERVER_URL:', process.env.NEXT_PUBLIC_SERVER_URL)
              return []
            }
          })()
        : []),
    ],
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
      // Optimize chunk splitting for better code splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Separate chunk for large libraries
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            // Separate chunk for icons to reduce initial bundle
            icons: {
              name: 'icons',
              test: /[\\/]node_modules[\\/]@heroicons[\\/]/,
              chunks: 'all',
              priority: 25,
            },
            // Separate chunk for headlessui
            headlessui: {
              name: 'headlessui',
              test: /[\\/]node_modules[\\/]@headlessui[\\/]/,
              chunks: 'all',
              priority: 25,
            },
          },
        },
      }
    }
    return config
  },
  experimental: {
    // optimizeCss: true, // Disabled due to critters dependency issue
  },
  // Enable standalone output for Docker
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        // Security headers for all routes
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
      {
        // Cache headers for static JavaScript files (Next.js chunks)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache headers for static CSS files
        source: '/_next/static/:path*.css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache headers for images in public folder
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache headers for uploads
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache headers for other static assets (favicon, manifest, etc.)
        source: '/:path*\\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // HTML documents: no-store so CDN/browser never serve stale HTML with old chunk URLs (avoids "Unexpected token '<'" when chunk returns 404 HTML)
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      {
        source: '/((?!_next|api|images|uploads|favicon\\.ico|manifest\\.json|robots\\.txt|sitemap\\.xml).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
