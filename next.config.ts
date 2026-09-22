import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

// Same-origin plus inline (DESIGN §8): Next hands the browser its data in inline scripts, and a nonce per
// request would make every page dynamic. External scripts, exfiltration targets and framing are still shut.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseHost ? ` https://${supabaseHost}` : ''}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for the VPS Docker image.
  output: 'standalone',
  poweredByHeader: false,

  // Performance optimizations for the "Living Manuscript" aesthetic
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['next'],
    // The site's 404 page (src/app/global-not-found.tsx): there is no single root layout to hang a not-found.tsx on.
    globalNotFound: true,
  },

  // Image optimization settings
  images: {
    // Enable responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Add blur placeholder support
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: supabaseHost
      ? [
          {
            protocol: 'https',
            hostname: supabaseHost,
          },
        ]
      : [],
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
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        // Files under public/images keep their names when their content changes, so they must not be
        // `immutable`: a day bounds how long a replaced image stays stale. Hashed assets under
        // /_next/static are Next's own business and are left alone.
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },
};
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
