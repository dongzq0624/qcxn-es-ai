import { ref, computed, watchEffect } from 'vue'
import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('auto')
  const isDark = ref(false)

  // 获取基于时间的实际主题
  const getThemeByTime = () => {
    const hour = new Date().getHours()
    // 晚上8点(20)到早上8点(8)之间使用暗色主题
    return hour >= 20 || hour < 8 ? 'dark' : 'light'
  }

  // 计算实际使用的主题（考虑auto模式）
  const actualTheme = computed(() => {
    if (theme.value === 'auto') {
      return getThemeByTime()
    }
    return theme.value
  })

  // 应用主题
  const applyTheme = (newTheme: Theme) => {
    theme.value = newTheme
    const html = document.documentElement

    // 获取实际要应用的主题
    const themeToApply = actualTheme.value

    if (themeToApply === 'dark') {
      html.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
      isDark.value = true
    } else {
      html.classList.remove('dark')
      html.setAttribute('data-theme', 'light')
      isDark.value = false
    }
  }

  // 监听系统主题变化
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme.value === 'auto') {
        applyTheme('auto')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }

  // 初始化主题
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      theme.value = savedTheme
    }
    applyTheme(theme.value)
    setupSystemThemeListener()
  }

  // 设置主题
  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // 切换主题
  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(theme.value)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  return {
    theme,
    isDark,
    actualTheme,
    initTheme,
    setTheme,
    toggleTheme,
  }
})
