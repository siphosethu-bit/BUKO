import type { NextConfig } from 'next';
const config: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
  poweredByHeader: false,
  images: { qualities: [75, 90, 95], remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }] },
  async headers() { return [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  ] }]; },
};
export default config;
