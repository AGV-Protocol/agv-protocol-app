/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@thirdweb-dev/react', '@thirdweb-dev/sdk'],
};
module.exports = nextConfig;