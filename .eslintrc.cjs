/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-prettier",
  ],
  env: {
    "vue/setup-compiler-macros": true,
    jquery: true,
  },
  rules: {
    "prefer-const": "warn",
    "no-var": "error",
  },
  globals: {
    ga: "readonly",
  },
  ignorePatterns: [".eslintrc.cjs", "vite.config.js", "wallaby.conf.js"],
};
