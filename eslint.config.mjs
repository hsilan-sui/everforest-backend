import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import prettierPlugin from "eslint-plugin-prettier";

export default defineConfig([
  {
    ignores: ["eslint.config.mjs"], // ✅ 忽略自己這個檔案
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
    plugins: {
      js,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      "prettier/prettier": "warn",
    },
  },
]);
