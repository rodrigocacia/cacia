import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // Arquivo gerado por scripts/gerar-icones.mjs: dezenas de KB de dados de
    // desenho. Regras escritas para código humano não têm o que dizer aqui.
    ignores: ['src/lib/icones.ts'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
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
    },
  },
];

export default eslintConfig;
