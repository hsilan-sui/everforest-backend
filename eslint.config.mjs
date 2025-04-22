import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import prettierPlugin from "eslint-plugin-prettier";

export default defineConfig([
  {
    ignores: ["eslint.config.mjs", "node_modules/", "dist/", "coverage/"],
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest, // Add Jest globals here
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
      },
    },
    plugins: {
      js,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      "prettier/prettier": ["warn", { semi: true, singleQuote: false }],
      "func-style": ["error", "expression"],
      "no-var": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-implicit-coercion": "warn",
      "sort-imports": ["warn", { ignoreDeclarationSort: true, ignoreMemberSort: false }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
]);
