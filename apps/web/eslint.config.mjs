import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier/flat"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "next-env.d.ts",
    // Arquivo gerado por scripts/gerar-icones.mjs: dezenas de KB de dados de
    // desenho. Regras escritas para código humano não têm o que dizer aqui.
    "src/lib/icones.ts",
  ]),
  {
    rules: {
      semi: ["off"],
      quotes: ["error", "double"],
      "prefer-arrow-callback": ["error"],
      "prefer-template": ["error"],
      // Regras do React Compiler que chegaram com o eslint-config-next 16.
      // Apontam padrões que já existiam (setState em effect, componente
      // declarado dentro de outro) — avisos até a refatoração própria.
      "react-hooks/set-state-in-effect": ["warn"],
      "react-hooks/static-components": ["warn"],
      "react-hooks/purity": ["warn"],
    },
  },
])
