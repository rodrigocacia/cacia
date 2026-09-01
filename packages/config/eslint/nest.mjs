import base from "./base.mjs";
import tseslint from "typescript-eslint";

export default tseslint.config(...base, {
  rules: {
    // Decorators do Nest exigem classes vazias e injeção por tipo
    "@typescript-eslint/no-extraneous-class": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    // Erros capturados em catch chegam como unknown; o padrão do Nest é acessá-los
    "@typescript-eslint/no-explicit-any": "warn",
  },
});
