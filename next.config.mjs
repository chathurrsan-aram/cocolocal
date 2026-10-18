/** @type {import('next').NextConfig} */
const LIST_HOST = 'list.cocolocal.co.uk';

const nextConfig = {
  // The old password-protected wheel demo now lives at /wheel.
  async redirects() {
    return [{ source: '/spin', destination: '/wheel', permanent: false }];
  },
  // The cash and carry list is a static page in public/list. It is served at /list,
  // and at the root of list.cocolocal.co.uk once that subdomain points at Vercel.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', has: [{ type: 'host', value: LIST_HOST }], destination: '/list/index.html' },
      ],
      afterFiles: [{ source: '/list', destination: '/list/index.html' }],
    };
  },
  // Keep the list out of search results on both addresses.
  async headers() {
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      { source: '/list/:path*', headers: noindex },
      { source: '/:path*', has: [{ type: 'host', value: LIST_HOST }], headers: noindex },
    ];
  },
};

export default nextConfig;
