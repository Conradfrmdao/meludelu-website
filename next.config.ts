import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Interim photography is served from Unsplash; owner-supplied image URLs can come from any https host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    qualities: [75, 85],
  },
  poweredByHeader: false,
};

export default nextConfig;
