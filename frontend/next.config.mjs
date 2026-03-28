/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Forward everything under /api/* to Spring Boot
      // EXCEPT /api/auth/* which has its own Next.js route handlers above
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

export default nextConfig;
