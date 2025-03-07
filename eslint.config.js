import vueTsEslintConfig from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

/** @type { import("eslint").Linter.Config[] } */
export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),

  {
    name: 'app/overrides',
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },


  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/*.spec.ts'],
  },
  skipFormatting,
]
