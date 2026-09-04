import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Testes de ponta a ponta — exigem PostgreSQL e Redis de verdade.
 *
 * Configuração separada da dos testes unitários porque a natureza é outra:
 * aqui cada arquivo sobe a aplicação inteira e compartilha um banco. Rodar em
 * paralelo faria um teste truncar a tabela que o outro acabou de popular, e a
 * falha apareceria de forma intermitente — o pior tipo de teste ruim.
 */
export default defineConfig({
  // O esbuild, que o Vitest usa por padrão, apaga os metadados de tipo dos
  // decorators. Sem eles o Nest não sabe o que injetar e todo construtor
  // recebe `undefined` — a aplicação nem sobe. O SWC os preserva.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: ['./test/apoio/ambiente.ts'],
    globalSetup: ['./test/apoio/preparar-banco.ts'],
    // Processos, e um de cada vez: o banco é recurso compartilhado
    pool: 'forks',
    fileParallelism: false,
    // Subir a aplicação e aplicar as migrations leva mais que o padrão de 5s
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
