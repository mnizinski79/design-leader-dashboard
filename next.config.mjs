/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["next-auth", "@auth/core", "jose", "oauth4webapi", "openid-client"],
  experimental: {
    // Don't serve stale cached pages when navigating between routes.
    // Without this, Next.js caches server component output for 30s client-side,
    // so mutations on one page won't reflect on another until a hard refresh.
    staleTimes: { dynamic: 0 },
  },
};

export default nextConfig;
