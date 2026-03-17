import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "app.iloveteto.com",
        pathname: "/**",
      }
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow cross-origin iframes (e.g. multiembed.mov) to trigger fullscreen
            key: "Permissions-Policy",
            value: "fullscreen=*, autoplay=*, picture-in-picture=*, encrypted-media=*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
