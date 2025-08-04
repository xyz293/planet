import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  // ✅ React/浏览器代码配置
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['mock/**'], // 👈 如果 mock 文件夹不需要 ESLint，可以直接忽略
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser, // 👈 浏览器环境
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // ✅ Node.js 文件专用配置（mock server）
  {
    files: ['mock/**/*.js'], // 只对 mock 里的 server.js 生效
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node, // 👈 ✅ 关键：这里加上 Node 全局变量
    },
    rules: {
      // 如果不想 mock 文件报 React 相关规则，可以清空或者调整
    },
  }
])
