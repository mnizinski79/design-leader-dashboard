/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["next-auth", "@auth/core", "jose", "oauth4webapi", "openid-client"],
};

export default nextConfig;
