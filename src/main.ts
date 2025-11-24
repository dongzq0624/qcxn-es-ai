import { createApp, watchEffect } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './style.css'
import './styles/dark.css'
import 'highlight.js/styles/github.css'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { useThemeStore } from './stores/theme'
import { useSettingsStore } from './stores/settings'

// 创建Vue应用实例
const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用Element Plus
app.use(ElementPlus)

// 使用国际化
app.use(i18n)

// 使用Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// 使用路由
app.use(router)

// 初始化主题和设置
const themeStore = useThemeStore()
const settingsStore = useSettingsStore()

themeStore.initTheme()

// 监听设置变化
watchEffect(() => {
  // 主题设置
  if (settingsStore.settings.theme !== themeStore.theme) {
    themeStore.setTheme(settingsStore.settings.theme)
  }

  // 语言设置
  if (i18n.global.locale.value !== settingsStore.settings.language) {
    i18n.global.locale.value = settingsStore.settings.language
  }
})

// 处理GitHub Pages SPA路由问题 - 从404.html恢复原始路径
const urlParams = new URLSearchParams(window.location.search)
const path = urlParams.get('p')
if (path) {
  // 恢复原始路径并解码特殊字符
  const decodedPath = path.replace(/~and~/g, '&')
  // 使用replace而不是push，避免在历史记录中留下重定向痕迹
  router.replace('/' + decodedPath)
}

// 全局错误处理
// 1. Vue错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue应用错误:', err, info)
  // 重定向到500页面
  router.push('/500')
}

// 2. 全局JavaScript错误处理
window.onerror = (message, source, lineno, colno, error) => {
  console.error('全局JavaScript错误:', message, source, lineno, colno, error)
  // 避免循环重定向到500页面
  if (!window.location.pathname.includes('/500')) {
    router.push('/500')
  }
  return true // 阻止默认处理
}

// 3. 未处理的Promise拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason)
  // 避免循环重定向到500页面
  if (!window.location.pathname.includes('/500')) {
    router.push('/500')
  }
})

// 挂载应用
app.mount('#app')
