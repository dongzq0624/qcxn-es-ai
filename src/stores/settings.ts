import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type SendMode = 'enter' | 'ctrlEnter'
export type Theme = 'light' | 'dark' | 'auto'
export type Language = 'zh' | 'en' | 'ko'

export interface SettingsState {
  // 基础设置
  avatar: string
  sendMode: SendMode
  theme: Theme
  language: Language
  fontSize: number
  chatFont: string
  autoGenerateTitle: boolean

  // 界面设置
  maskStartup: boolean
  hideBuiltinMasks: boolean
  disablePromptAutoComplete: boolean
  customPromptCount: number

  // 模型设置
  model: string
  temperature: number
  topP: number
  maxTokens: number
  presencePenalty: number
  frequencyPenalty: number
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<SettingsState>({
    // 基础设置
    avatar: '😊',
    sendMode: 'enter',
    theme: 'auto',
    language: 'zh',
    fontSize: 14,
    chatFont: 'Arial',
    autoGenerateTitle: true,

    // 界面设置
    maskStartup: true,
    hideBuiltinMasks: false,
    disablePromptAutoComplete: false,
    customPromptCount: 0,

    // 模型设置
    model: 'deepseek',
    temperature: 0.5,
    topP: 1.0,
    maxTokens: 4000,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
  })

  // 加载保存的设置
  const loadSettings = () => {
    const saved = localStorage.getItem('nextchat-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        Object.assign(settings.value, parsed)
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }

  // 保存设置
  const saveSettings = () => {
    localStorage.setItem('nextchat-settings', JSON.stringify(settings.value))
  }

  // 重置设置
  const resetSettings = () => {
    const defaultSettings: SettingsState = {
      avatar: '😊',
      sendMode: 'enter',
      theme: 'auto',
      language: 'zh',
      fontSize: 14,
      chatFont: 'Arial',
      autoGenerateTitle: true,
      maskStartup: true,
      hideBuiltinMasks: false,
      disablePromptAutoComplete: false,
      customPromptCount: 0,
      model: 'deepseek',
      temperature: 0.5,
      topP: 1.0,
      maxTokens: 4000,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
    }
    Object.assign(settings.value, defaultSettings)
    saveSettings()
  }

  // 初始化
  loadSettings()

  // 监听设置变化，自动保存
  watch(
    settings,
    () => {
      saveSettings()
    },
    { deep: true }
  )

  return {
    settings,
    saveSettings,
    resetSettings,
  }
})
