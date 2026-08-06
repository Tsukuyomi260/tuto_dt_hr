import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Les épreuves et les photos d'énoncés transitent en base64 : on garde une
  // marge sur la taille de corps acceptée par les Server Actions.
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
