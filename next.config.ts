import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Les épreuves et les photos d'énoncés transitent en base64 : on garde une
  // marge sur la taille de corps acceptée par les Server Actions.
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  // Le corpus est lu sur le disque à l'exécution : sans ça, il est absent du
  // paquet déployé et le tuteur perd l'annale en production.
  outputFileTracingIncludes: {
    "/api/chat": ["./data/corpus/**"],
  },
};

export default nextConfig;
