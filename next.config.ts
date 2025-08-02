import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations for the "Living Manuscript" aesthetic
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['next'],
  },

  // Image optimization settings
  images: {
    // Enable responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Add blur placeholder support
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compress pages and static files
  compress: true,
  
  // Turbopack optimizations (replacing webpack configuration)
  // Note: Turbopack handles most optimizations automatically
  // Custom optimizations can be added via experimental features

  // Headers for caching and security
  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: '/(.*\\.(?:jpg|jpeg|png|webp|avif|gif|svg|ico|woff|woff2))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache CSS and JS with versioning
        source: '/(.*\\.(?:css|js))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Enable font-display swap for all font files
        source: '/(.*\\.(?:woff|woff2|ttf|otf))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'font-display',
            value: 'swap',
          },
        ],
      },
    ];
  },
};

export default nextConfig;