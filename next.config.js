/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,

  // Environment variables that will be available on the client side
  publicRuntimeConfig: {
    apiUrl: process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL,
  },

  // Redirect VITE_API_URL to NEXT_PUBLIC_API_URL for compatibility
  env: {
    NEXT_PUBLIC_API_URL: process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL,
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Optimize images
  images: {
    domains: [],
    unoptimized: true, // For static export
  },
}

module.exports = nextConfig