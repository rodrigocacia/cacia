import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Foto de perfil do WhatsApp. Documentos não passam por aqui: saem por
    // link temporário do storage.
    remotePatterns: [{ protocol: "https", hostname: "pps.whatsapp.net" }],
    // No Cloudflare Workers não há otimizador de imagem do Next (ele depende
    // do sharp, binário nativo); a foto vai direto da origem.
    unoptimized: true,
  },
  // O sharp é rastreado pelo Next mesmo sem uso; no build para Workers o
  // binário nativo quebra o empacotamento (visto no Windows).
  outputFileTracingExcludes: {
    "*": ["**/node_modules/sharp/**", "**/node_modules/@img/**"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
}

export default nextConfig
