import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    domains: [
      "ialqt.nyc3.digitaloceanspaces.com",
      "pps.whatsapp.net",
      "cacia.nyc3.digitaloceanspaces.com",
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
}

export default nextConfig
