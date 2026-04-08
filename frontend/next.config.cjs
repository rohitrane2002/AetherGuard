/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: 'https://aetherguard-api.onrender.com/:path*',
        destination: 'https://aetherguard-api.onrender.com/:path*',
      },
    ]
  },
};

module.exports = nextConfig;