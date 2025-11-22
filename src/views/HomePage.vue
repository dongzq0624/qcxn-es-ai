<template>
  <div ref="chatContainerRef" class="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-800">
    <!-- 顶部工具栏 -->
    <div
      class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-600"
    >
      <div>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {{ currentConversation?.title || '新的聊天' }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          共 {{ currentConversation?.messages.length || 0 }} 条消息
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          title="清除当前聊天"
          @click="clearCurrentChat"
        >
          <Trash2 class="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          v-if="typingMessages.size > 0 || apiStore.isLoading"
          class="rounded-lg p-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          title="停止生成"
          @click="handleStopStreaming"
        >
          <StopCircle class="h-4 w-4 text-red-500" />
        </button>
        <button
          class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          title="导出为PNG"
          @click="exportToPNG"
        >
          <Download class="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>

    <!-- 调用 ChatArea 组件处理聊天核心功能 -->
    <ChatArea />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { Download, Trash2 } from 'lucide-vue-next'
  import { StopCircle } from 'lucide-vue-next'
  import { useChatStore } from '@/stores/chat'
  import { useSettingsStore } from '@/stores/settings'
  import { useApiStore } from '@/stores/api'
  import { ElMessage } from 'element-plus'
  import * as htmlToImage from 'html-to-image'
  import ChatArea from '@/components/ChatArea.vue'

  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()
  const apiStore = useApiStore()
  const route = useRoute()
  const typingMessages = ref<Set<string>>(new Set())

  const chatContainerRef = ref<HTMLElement>()

  const currentConversation = computed(() => chatStore.currentConversation)

  // 监听路由参数变化，设置当前对话ID
  onMounted(() => {
    const uuid = route.params.uuid as string
    if (uuid) {
      // 检查是否存在该ID的对话
      const conversationExists = chatStore.conversations.some((c) => c.id === uuid)
      if (conversationExists) {
        chatStore.setCurrentConversation(uuid)
      }
    }
  })

  const handleStopStreaming = () => {
    apiStore.stopStreaming()
    typingMessages.value.clear()
  }

  const clearCurrentChat = () => {
    if (!currentConversation.value) return

    if (currentConversation.value.messages.length === 0) {
      ElMessage.info('当前聊天已经是空的')
      return
    }

    if (confirm('确定要清除当前聊天的所有内容吗？此操作不可恢复。')) {
      currentConversation.value.messages = []
      currentConversation.value.lastMessage = ''

      localStorage.setItem('nextchat-conversations', JSON.stringify(chatStore.conversations))

      ElMessage.success('聊天内容已清除')
    }
  }

  const exportToPNG = async () => {
    try {
      const messageArea = document.querySelector('.flex-1.overflow-y-auto.p-6') as HTMLElement
      if (!messageArea) {
        ElMessage.error('无法找到消息区域')
        return
      }

      ElMessage.info('正在生成图片...')

      const dataUrl = await htmlToImage.toPng(messageArea, {
        backgroundColor: document.documentElement.classList.contains('dark')
          ? '#1f2937'
          : '#ffffff',
        width: messageArea.scrollWidth,
        height: messageArea.scrollHeight,
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.download = `chat-${currentConversation.value?.title || 'conversation'}-${new Date().getTime()}.png`
      link.href = dataUrl
      link.click()

      ElMessage.success('图片导出成功！')
    } catch (error) {
      console.error('导出PNG失败:', error)
      ElMessage.error('导出失败，请重试')
    }
  }
</script>

<style scoped>
  /* 移动端优化 */
  @media (max-width: 1023px) {
    /* 确保消息区域填满可用空间 */
    .flex-1.overflow-y-auto {
      flex: 1 !important;
      min-height: 0 !important;
      padding: 1rem !important;
    }

    /* 优化输入区域 */
    .border-t {
      padding: 0.75rem !important;
    }

    /* 优化消息间距 */
    .space-y-4 {
      gap: 0.5rem !important;
    }

    /* 优化按钮大小 */
    button {
      min-height: 32px !important;
      min-width: 32px !important;
    }

    /* 优化文本消息内边距 */
    .px-4.py-3 {
      padding: 0.75rem 1rem !important;
    }

    /* 优化代码块内边距 */
    pre {
      padding: 0.75rem !important;
    }

    /* 优化头像大小 */
    .w-8.h-8 {
      width: 1.75rem !important;
      height: 1.75rem !important;
    }

    /* 优化操作按钮 */
    .w-3.h-3 {
      width: 0.875rem !important;
      height: 0.875rem !important;
    }
  }
</style>

<style scoped>
  /* 移动端优化 - 使聊天区域充满屏幕 */
  @media (max-width: 1023px) {
    /* 移动端消息区域最大化 */
    .flex-1.overflow-y-auto.p-6 {
      flex: 1 !important;
      min-height: 0 !important;
      padding: 1rem !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
      overflow-y: auto !important;

      /* 移除固定高度，让flex布局自动处理 */
    }

    /* 移动端顶部工具栏优化 */
    .flex.items-center.justify-between.p-4 {
      height: 56px !important;
      padding: 0.75rem 1rem !important;
      flex-shrink: 0 !important;
    }

    /* 移动端输入区域优化 */
    .border-t.border-gray-200.p-4 {
      padding: 0.75rem 1rem !important;
      flex-shrink: 0 !important;
      max-height: 180px !important;
    }

    /* 移动端textarea优化 */
    textarea {
      min-height: 40px !important;
      max-height: 120px !important;
    }
  }

  /* 横屏模式优化 */
  @media (max-width: 1023px) and (orientation: landscape) {
    /* 横屏时消息区域 */
    .flex-1.overflow-y-auto.p-6 {
      min-height: 0 !important;

      /* 移除固定高度，让flex布局自动处理 */
    }

    /* 横屏时输入区域 */
    .border-t.border-gray-200.p-4 {
      max-height: 140px !important;
      padding: 0.5rem 1rem !important;
    }

    /* 横屏时textarea */
    textarea {
      max-height: 80px !important;
    }
  }

  /* 针对小屏幕手机优化 */
  @media (max-width: 375px) {
    /* 小屏幕手机消息间距优化 */
    .space-y-4 > * + * {
      margin-top: 0.5rem !important;
    }

    /* 小屏幕手机内边距优化 */
    .flex-1.overflow-y-auto.p-6 {
      padding: 0.75rem !important;
    }

    /* 小屏幕手机字体大小优化 */
    .text-lg {
      font-size: 1rem !important;
    }

    .px-4.py-2 {
      padding: 0.5rem 0.75rem !important;
    }
  }
</style>
