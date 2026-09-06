import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    // Arquivo gerado por scripts/gerar-icones.mjs: dezenas de KB de dados de
    // desenho. Regras escritas para código humano não têm o que dizer aqui.
    ignores: ['src/lib/icones.ts'],
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    rules: {
      semi: ["off"],
      quotes: ["error", "double"],
      "prefer-arrow-callback": ["error"],
      "prefer-template": ["error"],
    },
  }),
]

export default eslintConfig
