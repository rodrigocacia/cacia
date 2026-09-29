import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Foto de perfil do WhatsApp. Documentos não passam por aqui: saem por
    // link temporário do storage.
    domains: ["pps.whatsapp.net"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
}

export default nextConfig
