import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Testes do frontend.
 *
 * Cobrem a camada de tradução entre o vocabulário da interface e o da API —
 * ver src/http/adaptador.ts. É o ponto onde um erro não quebra uma tela, e sim
 * todas: um campo renomeado errado aparece como "undefined" em toda a
 * aplicação ao mesmo tempo.
 */
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
