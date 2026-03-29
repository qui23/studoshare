import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home-screen',
        permanent: false,
      },
    ];
  },

  webpack(config) {
    // Allow better-sqlite3 native module to be used in API routes
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
      'better-sqlite3',
    ];

    config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: [/node_modules/],
        use: [{ loader: '@dhiwise/component-tagger/nextLoader' }],
      });

    return config;
  },
};
export default nextConfig;