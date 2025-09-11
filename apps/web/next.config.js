/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@k-saju/ui', '@k-saju/api'],
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
