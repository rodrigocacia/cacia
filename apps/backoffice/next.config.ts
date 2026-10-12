import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ver apps/web/next.config.ts: sem otimizador de imagem no Cloudflare
  // Workers, e o sharp rastreado quebra o empacotamento.
  images: { unoptimized: true },
  outputFileTracingExcludes: {
    '*': ['**/node_modules/sharp/**', '**/node_modules/@img/**'],
  },
};

export default nextConfig;
