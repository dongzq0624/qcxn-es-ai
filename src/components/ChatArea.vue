<template>
  <div class="flex min-h-0 flex-1 flex-col bg-gray-50 dark:bg-gray-900">
    <!-- 消息显示区域 - 使用flex-1和min-h-0确保内容溢出时能正确滚动 -->
    <div ref="messagesContainer" class="min-h-0 flex-1 overflow-y-auto p-6">
      <div class="mx-auto max-w-3xl space-y-6">
        <div v-if="!currentConversation?.messages.length" class="mt-16 text-center text-gray-500">
          <div class="mx-auto max-w-md">
            <div
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <span class="text-2xl text-white">🤖</span>
            </div>
            <h3 class="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              欢迎使用 AI 助手
            </h3>
            <p class="text-gray-500 dark:text-gray-400">开始一个新的对话，探索无限可能</p>
          </div>
        </div>

        <div
          v-for="message in currentConversation?.messages"
          :key="message.id"
          class="message-item relative flex flex-col gap-3"
        >
          <!-- ChatGPT风格：消息内容 -->
          <div :class="['flex gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start']">
            <!-- AI头像 - ChatGPT风格 -->
            <div v-if="message.sender === 'assistant'" class="flex-shrink-0">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
              >
                <span class="text-sm font-semibold text-white">AI</span>
              </div>
            </div>

            <!-- 用户头像 - ChatGPT风格 -->
            <div v-if="message.sender === 'user'" class="order-2 flex-shrink-0">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                <span class="text-xs font-semibold text-white">
                  {{ settingsStore.settings.avatar }}
                </span>
              </div>
            </div>

            <!-- 消息气泡容器 -->
            <div :class="['max-w-3xl', message.sender === 'user' ? 'order-1' : 'order-2']">
              <!-- ChatGPT风格：AI助手标识 -->
              <div v-if="message.sender === 'assistant'" class="mb-1 flex items-center gap-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ settingsStore.settings.language === 'zh' ? 'AI 助手' : 'AI Assistant' }}
                </span>
              </div>

              <!-- ChatGPT风格：消息气泡 -->
              <div
                v-if="message.type === 'text'"
                :class="[
                  'message-content group relative max-w-2xl rounded-lg px-4 py-3.5',
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
                ]"
                :style="{
                  fontSize: settingsStore.settings.fontSize + 'px',
                  fontFamily: settingsStore.settings.chatFont,
                }"
              >
                <div v-html="formatMessage(message.content)"></div>
                <!-- ChatGPT风格：消息操作按钮 -->
                <div
                  class="absolute right-2 top-2 flex items-center gap-1 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  :class="
                    message.sender === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                  "
                >
                  <button
                    v-if="message.sender === 'assistant'"
                    @click="retryMessage(message)"
                    class="rounded-md p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
                    title="重试"
                  >
                    <RotateCcw class="h-3.5 w-3.5" />
                  </button>
                  <button
                    @click="copyMessage(message)"
                    class="rounded-md p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
                    title="复制"
                  >
                    <Copy class="h-3.5 w-3.5" />
                  </button>
                  <button
                    @click="deleteMessage(message.id)"
                    class="rounded-md p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
                    title="删除"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <!-- ChatGPT风格：代码块 -->
              <div v-else-if="message.type === 'code'" class="message-content group relative">
                <!-- ChatGPT风格：代码块容器 -->
                <div
                  class="prose prose-sm dark:bg-gray-850 max-w-none overflow-x-auto rounded-lg bg-gray-50 p-4 text-sm"
                  :style="{
                    fontSize: settingsStore.settings.fontSize + 'px',
                    fontFamily: settingsStore.settings.chatFont,
                  }"
                >
                  <div v-html="formatMessage(message.content)"></div>
                </div>

                <!-- ChatGPT风格：代码操作按钮 -->
                <div class="absolute right-2 top-2 z-10 flex gap-1">
                  <button
                    v-if="message.sender === 'assistant'"
                    @click="retryMessage(message)"
                    class="rounded bg-gray-700 p-1 text-gray-300 transition-colors hover:bg-gray-600"
                    title="重试"
                  >
                    <RotateCcw class="h-3 w-3" />
                  </button>
                  <button
                    @click="copyMessage(message)"
                    class="rounded bg-gray-700 p-1 text-gray-300 transition-colors hover:bg-gray-600"
                    title="复制"
                  >
                    <Copy class="h-3 w-3" />
                  </button>
                  <button
                    @click="deleteMessage(message.id)"
                    class="rounded bg-gray-700 p-1 text-red-400 transition-colors hover:bg-red-900/20"
                    title="删除"
                  >
                    <Trash2 class="h-3 w-3" />
                  </button>
                </div>
              </div>

              <!-- 时间戳 -  -->
              <div
                class="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
              >
                <div
                  v-if="message.sender === 'assistant' && message.model"
                  class="flex items-center gap-2"
                >
                  <span
                    class="rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-2 py-1 text-xs font-medium text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300"
                  >
                    {{ message.model }}
                  </span>
                </div>
                <div
                  class="flex items-center gap-2"
                  :class="message.sender === 'user' ? 'ml-auto' : ''"
                >
                  <span class="text-gray-400 dark:text-gray-500">{{ message.timestamp }}</span>
                  <div
                    class="h-2 w-2 animate-pulse rounded-full bg-green-400"
                    v-if="typingMessages.has(message.id)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 - 使用flex-shrink-0确保固定在底部 -->
    <div
      class="flex-shrink-0 border-t border-gray-200 bg-white/70 p-6 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/70"
    >
      <!-- 输入框 -->
      <div class="flex items-center gap-3">
        <div class="relative flex-1">
          <textarea
            v-model="inputMessage"
            @keydown="handleKeyDown"
            :placeholder="$t('chat.typeMessage')"
            class="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200"
            rows="1"
          ></textarea>
          <div class="absolute bottom-3 right-3 flex items-center gap-2">
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {{ settingsStore.settings.sendMode === 'enter' ? 'Enter' : 'Ctrl+Enter' }}
            </span>
          </div>
        </div>
        <button
          @click="sendMessage"
          class="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
        >
          {{ $t('chat.send') }}
        </button>
      </div>

      <!-- 提示文字 -->
      <p class="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
        {{
          settingsStore.settings.sendMode === 'enter' ? $t('chat.enterToSend') : 'Ctrl + Enter 发送'
        }}
        • {{ $t('chat.shiftEnterToNewLine') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
  import {
    Edit3,
    Link,
    Copy,
    MoreVertical,
    Camera,
    Image,
    FileText,
    Trash2,
    RotateCcw,
  } from 'lucide-vue-next'
  import { useChatStore } from '@/stores/chat'
  import { useSettingsStore } from '@/stores/settings'
  import { useApiStore } from '@/stores/api'
  import { useI18n } from 'vue-i18n'
  import type { Message } from '@/stores/chat'
  import { ElMessage } from 'element-plus'
  import { marked } from 'marked'
  import hljs from 'highlight.js'
  import DOMPurify from 'dompurify'

  const { t } = useI18n()
  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()
  const apiStore = useApiStore()
  const inputMessage = ref('')
  const typingMessages = ref<Set<string>>(new Set())
  const messagesContainer = ref<HTMLElement | null>(null)

  const currentConversation = computed(() => chatStore.currentConversation)

  // 统一的消息格式化函数
  const formatMessage = (content: string): string => {
    // 使用 marked 解析 Markdown
    let parsedContent = marked.parse(content) as string

    // 使用 DOMPurify 进行 XSS 防护
    parsedContent = DOMPurify.sanitize(parsedContent)

    return parsedContent
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (settingsStore.settings.sendMode === 'enter') {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
      } else if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault()
        addNewLine()
      }
    } else {
      if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault()
        sendMessage()
      } else if (event.key === 'Enter' && !event.ctrlKey) {
        event.preventDefault()
        addNewLine()
      }
    }
  }

  const addNewLine = () => {
    inputMessage.value += '\n'
  }

  const createNewChat = () => {
    chatStore.createNewConversation()
  }

  const sendMessage = async () => {
    if (!inputMessage.value.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      content: inputMessage.value,
      type: 'text',
      timestamp: new Date().toLocaleString(
        settingsStore.settings.language === 'zh' ? 'zh-CN' : 'en-US'
      ),
      sender: 'user',
      model: settingsStore.settings.model,
    }

    chatStore.addMessage(chatStore.currentConversationId, message)
    inputMessage.value = ''

    try {
      const currentConversation = chatStore.currentConversation
      if (!currentConversation) return

      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: Message = {
        id: aiMessageId,
        content: '',
        type: 'text',
        timestamp: new Date().toLocaleString(
          settingsStore.settings.language === 'zh' ? 'zh-CN' : 'en-US'
        ),
        sender: 'assistant',
        model: settingsStore.settings.model,
      }

      chatStore.addMessage(chatStore.currentConversationId, aiMessage)
      typingMessages.value.add(aiMessageId)

      let fullContent = ''

      await apiStore.sendStreamingMessage(
        currentConversation.messages,
        settingsStore.settings.model,
        {
          temperature: settingsStore.settings.temperature,
          presencePenalty: settingsStore.settings.presencePenalty || 0,
          frequencyPenalty: settingsStore.settings.frequencyPenalty || 0,
          topP: settingsStore.settings.topP,
        },
        (chunk: string) => {
          fullContent += chunk

          const messageIndex = currentConversation.messages.findIndex(
            (msg) => msg.id === aiMessageId
          )
          if (messageIndex !== -1) {
            currentConversation.messages[messageIndex].content = fullContent
          }
        }
      )

      typingMessages.value.delete(aiMessageId)

      // 滚动到底部
      scrollToBottom()
    } catch (error) {
      console.error('发送消息失败:', error)
      ElMessage.error('发送消息失败，请稍后重试')

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
        type: 'text',
        timestamp: new Date().toLocaleString(
          settingsStore.settings.language === 'zh' ? 'zh-CN' : 'en-US'
        ),
        sender: 'assistant',
      }
      chatStore.addMessage(chatStore.currentConversationId, errorMessage)
    }
  }

  const copyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content)
      ElMessage.success('消息已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      ElMessage.error('复制失败，请手动复制')
    }
  }

  const deleteMessage = (messageId: string) => {
    if (confirm('确定要删除这条消息吗？')) {
      const conversation = currentConversation.value
      if (conversation) {
        const messageIndex = conversation.messages.findIndex((msg) => msg.id === messageId)
        if (messageIndex !== -1) {
          conversation.messages.splice(messageIndex, 1)

          if (conversation.messages.length > 0) {
            const lastMessage = conversation.messages[conversation.messages.length - 1]
            conversation.lastMessage =
              lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '')
          } else {
            conversation.lastMessage = ''
          }

          localStorage.setItem('nextchat-conversations', JSON.stringify(chatStore.conversations))
          ElMessage.success('消息已删除')
        }
      }
    }
  }

  const retryMessage = async (message: Message) => {
    if (message.sender !== 'assistant') {
      ElMessage.warning('只能重试AI回复的消息')
      return
    }

    const conversation = currentConversation.value
    if (!conversation) return

    const messageIndex = conversation.messages.findIndex((msg) => msg.id === message.id)
    if (messageIndex <= 0) {
      ElMessage.warning('没有找到对应的用户消息')
      return
    }

    const userMessage = conversation.messages[messageIndex - 1]
    if (userMessage.sender !== 'user') {
      ElMessage.warning('消息顺序错误')
      return
    }

    try {
      ElMessage.info('正在重试生成回复...')

      conversation.messages.splice(messageIndex, 1)

      const newAiMessageId = Date.now().toString()
      const newAiMessage: Message = {
        id: newAiMessageId,
        content: '',
        type: 'text',
        timestamp: new Date().toLocaleString(
          settingsStore.settings.language === 'zh' ? 'zh-CN' : 'en-US'
        ),
        sender: 'assistant',
        model: settingsStore.settings.model,
      }

      conversation.messages.splice(messageIndex, 0, newAiMessage)
      typingMessages.value.add(newAiMessageId)

      let fullContent = ''

      await apiStore.sendStreamingMessage(
        conversation.messages,
        settingsStore.settings.model,
        {
          temperature: settingsStore.settings.temperature,
          presencePenalty: settingsStore.settings.presencePenalty || 0,
          frequencyPenalty: settingsStore.settings.frequencyPenalty || 0,
          topP: settingsStore.settings.topP,
        },
        (chunk: string) => {
          fullContent += chunk

          const msgIndex = conversation.messages.findIndex((msg) => msg.id === newAiMessageId)
          if (msgIndex !== -1) {
            conversation.messages[msgIndex].content = fullContent
          }
        }
      )

      typingMessages.value.delete(newAiMessageId)

      if (conversation.messages.length > 0) {
        const lastMsg = conversation.messages[conversation.messages.length - 1]
        conversation.lastMessage =
          lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : '')
        conversation.timestamp = new Date().toLocaleString('zh-CN')
      }

      localStorage.setItem('nextchat-conversations', JSON.stringify(chatStore.conversations))
      ElMessage.success('重试成功')

      // 滚动到底部
      scrollToBottom()
    } catch (error) {
      console.error('重试失败:', error)
      ElMessage.error('重试失败，请稍后重试')
    }
  }

  const scrollToBottom = () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }

  // 监听消息变化，自动滚动到底部
  const unwatch = computed(() => {
    return currentConversation.value?.messages.length
  })

  // 初始化 marked
  onMounted(() => {
    // 配置 marked
    marked.setOptions({
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext'
        return hljs.highlight(code, { language }).value
      },
      breaks: true,
      gfm: true,
    })
  })
</script>
