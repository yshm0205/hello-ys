import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();
const isDevelopment = process.env.NODE_ENV !== "production";

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  isDevelopment ? "'unsafe-eval'" : null,
  "https://js.tosspayments.com",
  "https://cdn.iamport.kr",
  "https://cdn.portone.io",
  "https://vercel.live",
  "https://player.vdocipher.com",
  "https://cdn.channel.io",
]
  .filter(Boolean)
  .join(" ");

const nextConfig: NextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // DNS Prefetch 활성화 (성능)
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // Clickjacking 방지
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // MIME-sniffing 방지
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer 정책
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 권한 정책 (카메라, 마이크, 위치 비활성화)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS — HTTPS 강제 (Vercel은 자동이지만 명시적으로)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // CSP — XSS 방지
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http: https://*.vdocipher.com",
              "connect-src 'self' https://*.supabase.co https://vercel.live wss://*.supabase.co https://*.vdocipher.com https://cdn.portone.io https://api.portone.io https://*.portone.io https://*.tosspayments.com https://pay.toss.im https://service.iamport.kr https://*.iamport.co https://*.channel.io wss://*.channel.io",
              "frame-src 'self' https://js.tosspayments.com https://player.vdocipher.com https://api.portone.io https://*.portone.io https://*.tosspayments.com https://pay.toss.im https://service.iamport.kr https://*.iamport.co https://*.channel.io",
              "media-src 'self' https://player.vdocipher.com https://*.vdocipher.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Mantine tree-shaking optimization
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
};

export default withNextIntl(nextConfig);
