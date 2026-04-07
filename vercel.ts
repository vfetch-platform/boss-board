const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  throw new Error('BACKEND_URL is required to proxy /api requests for boss-board.');
}

export const config = {
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
};
