import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Inspector from 'unplugin-vue-dev-locator/vite'
import traeBadgePlugin from 'vite-plugin-trae-solo-badge'
import { buildCompleteNotification } from './src/plugins/buildCompleteNotification'

// https://vite.dev/config/
export default defineConfig({
  // 设置基础路径，确保GitHub Pages正确加载资源
  base: '/qcxn-es-ai/',
  build: {
    sourcemap: 'hidden',
    outDir: 'qcxn-es-ai', // 设置打包输出目录为qcxn-es-ai
    // 配置分包处理
    rollupOptions: {
      output: {
        manualChunks: {
          // 将Vue相关库打包成一个chunk
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 将UI组件和第三方库分离
          'ui-components': ['lucide-vue-next'],
          // 将Markdown解析和XSS防护库打包
          'markdown-xss': ['marked', 'dompurify'],
          // 将国际化相关库打包
          i18n: ['vue-i18n'],
        },
      },
    },
  },
  server: {
    port: 8080, // 设置默认端口为8080
    open: true, // 自动打开浏览器
    host: true, // 允许从外部访问
  },
  // 自动启动配置
  preview: {
    port: 8080,
    open: true,
  },
  plugins: [
    vue(),
    Inspector(),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#app',
    }),
    buildCompleteNotification(), // 使用自定义构建完成提示插件
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // ✅ 定义 @ = src
    },
  },
})
