import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // O alias do tsconfig não é lido pelo Vitest — precisa ser declarado aqui
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
