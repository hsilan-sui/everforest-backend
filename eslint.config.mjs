import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import prettierPlugin from "eslint-plugin-prettier";

//Prettier 設定（格式統一）
const prettierOptions = {
  semi: true, // 行尾加分號；
  singleQuote: false, // 使用雙引號（"）而非單引號（'）
  printWidth: 100, // 每行最多 100 個字元
  tabWidth: 2, // tab 等於 2 個空格
  trailingComma: "es5", // 物件/陣列結尾逗號（僅 ES5 支援）
};

//整份eslint語法設定的主體
export default defineConfig([
  {
    ignores: ["eslint.config.mjs", "node_modules/", "dist/", "coverage/"],
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      sourceType: "commonjs", //用的是 require，所以是 commonjs
      globals: globals.node, //加入 Node.js 的全域變數，例如 __dirname、require
    },
    plugins: {
      js,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      "prettier/prettier": ["warn", prettierOptions],
      "func-style": ["error", "expression"],
      "no-var": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-implicit-coercion": "warn",
      "sort-imports": ["warn", { ignoreDeclarationSort: true, ignoreMemberSort: false }],
      //開發中打 console.log() 👉 會有 ⚠️ 警告，但不會卡住你開發
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
      "arrow-parens": ["error", "always"],
    },
  },
]);
