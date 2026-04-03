import js from "@eslint/js";
import tseslintParser from "typescript-eslint-parser";

export default [
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      ecmaVersion: 2020,
      parser: tseslintParser,
      globals: {
        console: "readonly",
        process: "readonly",
        global: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
