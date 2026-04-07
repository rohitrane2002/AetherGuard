/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://aetherguard-api.onrender.com/:path*',
      },
    ]
  },
};

module.exports = nextConfig;