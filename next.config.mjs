/** @type {import('next').NextConfig} */
const nextConfig = {
  // The old password-protected wheel demo now lives at /wheel.
  async redirects() {
    return [{ source: '/spin', destination: '/wheel', permanent: false }];
  },
};

export default nextConfig;
