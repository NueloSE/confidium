/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@confidium/core"],
  eslint: {
    // Lint is run as its own CI step, not during builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
