/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: '/api/backend/:path*',
      },
    ]
  },
};

module.exports = nextConfig;