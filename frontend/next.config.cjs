/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'aetherguard.vercel.app',
          },
        ],
        destination: 'https://aetherguard.ai/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;