import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import pluginVitest from "@vitest/eslint-plugin";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import globals from "globals";

/** @type { import("eslint").Linter.Config[] } */
export default [
  {
    name: "app/files-to-lint",
    files: ["**/*.{js,vue}"],
  },

  {
    name: "app/files-to-ignore",
    ignores: ["**/dist/**", "**/dist-ssr/**", "**/coverage/**"],
  },

  {
    name: "app/browser-globals",
    files: ["src/**/*.{js,vue}"],
    languageOptions: {
      globals: {
        bootstrap: "readonly",
      },
    },
  },

  {
    name: "app/node-globals",
    files: ["*.{js,vue}"],
    languageOptions: {
      globals: globals.node,
    },
  },

  js.configs.recommended,
  ...pluginVue.configs["flat/essential"],

  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/*.spec.js"],
  },
  skipFormatting,
];
