import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    '.open-next/**',
    '.wrangler/**',
    'next-env.d.ts',
    // Arquivo gerado por scripts/gerar-icones.mjs: dezenas de KB de dados de
    // desenho. Regras escritas para código humano não têm o que dizer aqui.
    'src/lib/icones.ts',
  ]),
  {
    rules: {
      // O prefixo `_` marca o parâmetro que existe só para manter a
      // assinatura — o caso dos filtros do painel de faturamento, que
      // continuam sendo passados por quem chama enquanto a cobrança não volta.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Ver apps/web/eslint.config.mjs: regras do React Compiler vindas com o
      // eslint-config-next 16, avisos até a refatoração própria.
      'react-hooks/set-state-in-effect': ['warn'],
      'react-hooks/purity': ['warn'],
    },
  },
]);
