import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading images from the Jellyfin server
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.1.50',
        port: '8096',
        pathname: '/Items/**',
      },
    ],
    unoptimized: true,
  },
  // Disable strict mode for smoother HLS playback
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;
