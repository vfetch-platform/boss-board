#!/usr/bin/env node
// Generates vercel.json at build time using the BACKEND_URL environment variable.
// Run: node generate-vercel-config.js
// Vercel Build Command: node generate-vercel-config.js

const fs = require('fs');

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  console.error('ERROR: BACKEND_URL environment variable is required.');
  process.exit(1);
}

const config = {
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

fs.writeFileSync('vercel.json', JSON.stringify(config, null, 2));
console.log(`Generated vercel.json — proxying /api/* to ${backendUrl}`);
