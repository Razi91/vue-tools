// import globals from "globals";
// import pluginVue from "eslint-plugin-vue";
//
// import path from "path";
// import { fileURLToPath } from "url";
// import { FlatCompat } from "@eslint/eslintrc";
// import pluginJs from "@eslint/js";
//
// import parser from '@typescript-eslint/parser'
//
// // mimic CommonJS variables -- not needed if using CommonJS
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//   baseDirectory: __dirname,
//   recommendedConfig: pluginJs.configs.recommended
// });
//
// export default [
//   {
//     languageOptions: {
//       parser: parser,
//       globals: globals.browser
//     }
//   },
//   ...compat.extends("standard-with-typescript"),
//   ...pluginVue.configs["flat/essential"],
// ];
module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/typescript/recommended',
    "@vue/eslint-config-prettier",
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    // Customize your rules here
    'vue/no-multiple-template-root': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  // settings: {
  //   "import/resolver": {
  //     node: {
  //       extensions: [".js", ".jsx", ".ts", ".tsx", ".cjs", ".mjs", ".vue"],
  //       moduleDirectory: ["node_modules", "src/"],
  //     },
  //   },
  // },
  // overrides: [
  //   {
  //     files: ["*.vue"],
  //     rules: {
  //       indent: "off",
  //     },
  //   },
  //   {
  //     files: [
  //       "**/__tests__/*.{j,t}s?(x)",
  //       "**/tests/unit/**/*.spec.{j,t}s?(x)",
  //     ],
  //     env: {
  //       jest: true,
  //     },
  //   },
  // ],
};
