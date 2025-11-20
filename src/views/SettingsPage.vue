<template>
  <div class="flex flex-1 flex-col bg-white dark:bg-gray-800">
    <!-- 顶部导航栏 -->
    <div
      class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-600"
    >
      <div>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {{ $t('settings.title') }}
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('settings.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400">设置自动保存</span>
        <button
          @click="goBack"
          class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <el-icon size="20"><Close /></el-icon>
        </button>
      </div>
    </div>

    <!-- 设置内容区域 -->
    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-4xl">
        <!-- 设置列表 - 扁平化设计 -->
        <div class="bg-white dark:bg-gray-800">
          <!-- 头像设置 -->
          <div
            class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700"
          >
            <div>
              <h4 class="font-medium text-gray-800 dark:text-gray-200">
                {{ $t('settings.avatar') }}
              </h4>
            </div>
            <el-button @click="selectAvatar" circle>
              {{ settingsStore.settings.avatar }}
            </el-button>
          </div>

          <!-- 版本信息 -->
          <div
            class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700"
          >
            <div>
              <h4 class="font-medium text-gray-800 dark:text-gray-200">
                {{ $t('settings.version') }}: v2.16.1
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ $t('settings.latestVersion') }}
              </p>
            </div>
            <el-button type="primary" plain @click="checkUpdate" size="small">
              {{ $t('settings.checkUpdate') }}
            </el-button>
          </div>

          <!-- 发送键设置 -->
          <div
            class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700"
          >
            <div>
              <h4 class="font-medium text-gray-800 dark:text-gray-200">
                {{ $t('settings.sendKey') }}
              </h4>
            </div>
            <el-select v-model="settingsStore.settings.sendMode" style="width: 120px">
              <el-option value="enter" label="Enter" />
              <el-option value="ctrlEnter" label="Ctrl + Enter" />
            </el-select>
          </div>

          <!-- 主题设置 -->
          <div
            class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700"
          >
            <div>
              <h4 class="font-medium text-gray-800 dark:text-gray-200">
                {{ $t('settings.theme') }}
              </h4>
            </div>
            <el-select v-model="settingsStore.settings.theme" style="width: 120px">
              <el-option value="light" :label="$t('theme.light')" />
              <el-option value="dark" :label="$t('theme.dark')" />
              <el-option value="auto" :label="$t('theme.auto')" />
            </el-select>
          </div>

          <!-- 语言设置 -->
          <div
            class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700"
          >
            <div>
              <h4 class="font-medium text-gray-800 dark:text-gray-200">
                {{ $t('settings.language') }}
              </h4>
            </div>
            <el-select v-model="settingsStore.settings.language" style="width: 120px">
              <el-option value="zh" label="简体中文" />
              <el-option value="en" label="English" />
              <el-option value="ko" label="한국어" />
            </el-select>
          </div>

          <!-- 字体大小 -->
          <div class="border-b border-gray-100 p-4 dark:border-gray-700">
            <div class="mb-2 flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-800 dark:text-gray-200">
                  {{ $t('settings.fontSize') }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ $t('settings.fontSizeDesc') }}
                </p>
              </div>
              <span
                class="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              >
                {{ settingsStore.settings.fontSize }}px
              </span>
            </div>
            <el-slider v-model="settingsStore.settings.fontSize" :min="12" :max="20" :step="1" />
          </div>

          <!-- 聊天字体 -->
          <div
            class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700"
          >
            <div>
              <h4 class="font-medium text-gray-800 dark:text-gray-200">
                {{ $t('settings.chatFont') }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ $t('settings.chatFontDesc') }}
              </p>
            </div>
            <el-select v-model="settingsStore.settings.chatFont" style="width: 150px">
              <el-option value="Arial" label="Arial" />
              <el-option value="Helvetica" label="Helvetica" />
              <el-option value="Times New Roman" label="Times New Roman" />
              <el-option value="Microsoft YaHei" label="微软雅黑" />
              <el-option value="SimSun" label="宋体" />
            </el-select>
          </div>

          <!-- 自动生成标题 -->
          <div
            class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700"
          >
            <div>
              <h4 class="font-medium text-gray-800 dark:text-gray-200">
                {{ $t('settings.autoGenerateTitle') }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ $t('settings.autoGenerateTitleDesc') }}
              </p>
            </div>
            <el-switch v-model="settingsStore.settings.autoGenerateTitle" />
          </div>

          <!-- 模型设置 -->
          <div class="border-b border-gray-100 p-4 dark:border-gray-700">
            <h3 class="mb-4 font-medium text-gray-800 dark:text-gray-200">模型设置</h3>

            <!-- 模型选择 -->
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-800 dark:text-gray-200">
                  {{ $t('settings.model') }}
                </h4>
              </div>
              <el-select v-model="settingsStore.settings.model" style="width: 150px">
                <el-option value="deepseek" label="DeepSeek (deepseek-chat)" />
                <el-option value="gpt-3.5-turbo" label="GPT-3.5 Turbo" />
                <el-option value="gpt-4" label="GPT-4" />
                <el-option value="gpt-4-turbo" label="GPT-4 Turbo" />
                <el-option value="claude-3.5" label="Claude 3.5" />
              </el-select>
            </div>

            <!-- 随机性 -->
            <div class="mb-4">
              <div class="mb-2 flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-800 dark:text-gray-200">
                    {{ $t('settings.temperature') }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ $t('settings.temperatureDesc') }}
                  </p>
                </div>
                <span
                  class="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                >
                  {{ settingsStore.settings.temperature }}
                </span>
              </div>
              <el-slider
                v-model="settingsStore.settings.temperature"
                :min="0"
                :max="2"
                :step="0.1"
              />
            </div>

            <!-- 核采样 -->
            <div class="mb-4">
              <div class="mb-2 flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-800 dark:text-gray-200">
                    {{ $t('settings.topP') }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ $t('settings.topPDesc') }}
                  </p>
                </div>
                <span
                  class="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                >
                  {{ settingsStore.settings.topP }}
                </span>
              </div>
              <el-slider v-model="settingsStore.settings.topP" :min="0" :max="1" :step="0.1" />
            </div>

            <!-- 最大Token数 -->
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-800 dark:text-gray-200">
                  {{ $t('settings.maxTokens') }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ $t('settings.maxTokensDesc') }}
                </p>
              </div>
              <el-input-number
                v-model="settingsStore.settings.maxTokens"
                :min="1"
                :max="8192"
                :step="100"
                style="width: 120px"
              />
            </div>
          </div>

          <!-- 危险操作 -->
          <div class="p-4">
            <h3 class="mb-4 font-medium text-red-600 dark:text-red-400">危险操作</h3>

            <!-- 重置所有设置 -->
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-800 dark:text-gray-200">
                  {{ $t('settings.resetAllSettings') }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ $t('settings.resetAllSettingsDesc') }}
                </p>
              </div>
              <el-button type="danger" @click="resetSettings">
                {{ $t('settings.resetNow') }}
              </el-button>
            </div>

            <!-- 清除所有数据 -->
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-800 dark:text-gray-200">
                  {{ $t('settings.clearAllData') }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ $t('settings.clearAllDataDesc') }}
                </p>
              </div>
              <el-button type="danger" @click="clearAllData">
                {{ $t('settings.clearNow') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Close } from '@element-plus/icons-vue'
  import { useSettingsStore } from '@/stores/settings'
  import { useChatStore } from '@/stores/chat'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const router = useRouter()
  const settingsStore = useSettingsStore()
  const chatStore = useChatStore()

  const goBack = () => {
    router.push('/')
  }

  const selectAvatar = () => {
    const avatars = ['😊', '😎', '🤔', '😄', '🥳', '🤖', '👨‍💻', '👩‍💻']
    const currentIndex = avatars.indexOf(settingsStore.settings.avatar)
    const nextIndex = (currentIndex + 1) % avatars.length
    settingsStore.settings.avatar = avatars[nextIndex]
  }

  const checkUpdate = () => {
    ElMessage.success('当前已是最新版本')
  }

  const resetSettings = async () => {
    try {
      await ElMessageBox.confirm('确定要重置所有设置吗？此操作不可恢复。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      settingsStore.resetSettings()
      ElMessage.success('设置已重置，将自动保存')
    } catch (error) {
      // 用户取消
    }
  }

  const clearAllData = async () => {
    try {
      await ElMessageBox.confirm(
        '确定要清除所有数据吗？此操作将删除所有聊天记录和设置。',
        '危险操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'error',
        }
      )

      // 清除聊天记录
      chatStore.conversations = []
      chatStore.currentConversationId = ''

      // 重置设置
      settingsStore.resetSettings()

      // 清除本地存储
      localStorage.clear()

      ElMessage.success('所有数据已清除，设置已自动保存')
      goBack()
    } catch (error) {
      // 用户取消
    }
  }
</script>
