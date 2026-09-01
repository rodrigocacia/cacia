import base from "./base.mjs";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(...base, {
  languageOptions: {
    globals: { ...globals.browser, ...globals.node },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
  },
});
