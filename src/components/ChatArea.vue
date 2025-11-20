<template>
  <div class="flex h-screen flex-1 flex-col bg-gray-50 dark:bg-gray-900">
    <!-- 顶部工具栏 - DeepSeek风格 -->
    <div
      class="flex items-center justify-between border-b border-gray-200 bg-white/70 p-4 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/70"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600"
        >
          <span class="text-sm font-bold text-white">AI</span>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {{ currentConversation?.title || '新的聊天' }}
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ currentConversation?.messages.length || 0 }} 条消息
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="group rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Edit3 class="h-4 w-4 text-gray-600 group-hover:text-blue-500 dark:text-gray-300" />
        </button>
        <button
          class="group rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Link class="h-4 w-4 text-gray-600 group-hover:text-blue-500 dark:text-gray-300" />
        </button>
        <button
          class="group rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Copy class="h-4 w-4 text-gray-600 group-hover:text-blue-500 dark:text-gray-300" />
        </button>
        <button
          class="group rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <MoreVertical
            class="h-4 w-4 text-gray-600 group-hover:text-blue-500 dark:text-gray-300"
          />
        </button>
      </div>
    </div>

    <!-- 消息显示区域 - DeepSeek风格 -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6">
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
      </div>

      <div
        v-for="message in currentConversation?.messages"
        :key="message.id"
        class="message-item relative flex flex-col gap-3"
      >
        <!-- 预览气泡 -->
        <div
          v-if="
            settingsStore.settings.previewBubble &&
            message.sender === 'assistant' &&
            message.content.length > 100
          "
          class="absolute -top-8 left-0 z-10 max-w-xs truncate rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity hover:opacity-100"
        >
          {{ message.content.slice(0, 50) }}...
        </div>

        <!-- 消息内容 - DeepSeek风格 -->
        <div :class="['flex gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start']">
          <!-- AI头像 -->
          <div v-if="message.sender === 'assistant'" class="flex-shrink-0">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <img src="@/assets/deepseek_logo.svg" alt="DeepSeek" class="h-6 w-6" />
            </div>
          </div>

          <!-- 用户头像 -->
          <div v-if="message.sender === 'user'" class="order-2 flex-shrink-0">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
              <span class="font-semibold text-white">{{ settingsStore.settings.avatar }}</span>
            </div>
          </div>

          <div :class="['max-w-3xl', message.sender === 'user' ? 'order-1' : 'order-2']">
            <div v-if="message.sender === 'assistant'" class="mb-1 flex items-center gap-2">
              <img src="@/assets/deepseek_logo.svg" alt="DeepSeek" class="h-4 w-4" />
              <span
                class="rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                DeepSeek
              </span>
            </div>
            <div
              v-if="message.type === 'text'"
              :class="[
                'group relative max-w-2xl rounded-xl px-5 py-4',
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100',
              ]"
              :style="{
                fontSize: settingsStore.settings.fontSize + 'px',
                fontFamily: settingsStore.settings.chatFont,
              }"
            >
              <!-- JSON内容显示 -->
              <div v-if="isJsonString(message.content)" class="whitespace-pre-wrap">
                <pre class="whitespace-pre-wrap">{{ formatMessageContent(message.content) }}</pre>
              </div>

              <!-- 包含代码块的内容 - DeepSeek风格 -->
              <div v-else-if="hasCodeBlock(message.content)" class="whitespace-pre-wrap">
                <div
                  v-for="(block, index) in extractCodeBlocks(message.content)"
                  :key="index"
                  class="mb-6"
                >
                  <!-- 代码块容器 -->
                  <div class="group relative">
                    <!-- 代码块头部 -->
                    <div
                      class="absolute left-0 right-0 top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500"
                        >
                          <Code class="h-3 w-3 text-white" />
                        </div>
                        <span class="text-sm font-semibold">
                          {{ block.language.toUpperCase() }}
                        </span>
                        <span class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400">
                          代码
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          @click="copyCode(block.code, block.language)"
                          class="group rounded-lg p-2 transition-colors hover:bg-gray-700"
                          title="复制代码"
                        >
                          <Copy class="h-4 w-4 group-hover:text-blue-400" />
                        </button>
                        <button
                          @click="downloadCode(block.code, block.language)"
                          class="group rounded-lg p-2 transition-colors hover:bg-gray-700"
                          title="下载代码"
                        >
                          <Download class="h-4 w-4 group-hover:text-green-400" />
                        </button>
                      </div>
                    </div>
                    <!-- 代码内容 -->
                    <pre
                      class="overflow-x-auto rounded-b-xl border border-gray-200 bg-gray-50 p-6 pt-16 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    ><code :class="'language-' + block.language">{{ block.code }}</code></pre>
                  </div>
                </div>
                <!-- 剩余文本内容 -->
                <div class="mt-4 leading-relaxed text-gray-700 dark:text-gray-300">
                  {{ message.content.replace(/```\w*\n[\s\S]*?```/g, '').trim() }}
                </div>
              </div>

              <!-- 普通文本内容 -->
              <div v-else class="whitespace-pre-wrap">{{ message.content }}</div>

              <!-- 消息操作按钮 -->
              <div
                class="absolute bottom-2 right-2 flex items-center gap-1 text-gray-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-gray-400"
              >
                <button
                  v-if="message.sender === 'assistant'"
                  @click="retryMessage(message)"
                  class="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="重试"
                >
                  <RotateCcw class="h-4 w-4" />
                </button>
                <button
                  @click="copyMessage(message)"
                  class="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="复制"
                >
                  <Copy class="h-4 w-4" />
                </button>
                <button
                  @click="deleteMessage(message.id)"
                  class="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="删除"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- 代码块 -->
            <div v-else-if="message.type === 'code'" class="group relative">
              <div class="absolute right-2 top-2 z-10 flex gap-1">
                <!-- 模式切换按钮 -->
                <div class="flex gap-1">
                  <button
                    @click="setPreviewMode('md')"
                    :class="[
                      'rounded px-2 py-1 text-xs',
                      previewMode === 'md' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300',
                    ]"
                  >
                    MD
                  </button>
                  <button
                    @click="setPreviewMode('json')"
                    :class="[
                      'rounded px-2 py-1 text-xs',
                      previewMode === 'json'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300',
                    ]"
                  >
                    JSON
                  </button>
                </div>
                <!-- 代码折叠按钮 -->
                <button
                  v-if="settingsStore.settings.enableCodeFold"
                  @click="toggleCodeFold(message.id)"
                  class="rounded bg-gray-700 p-1 text-gray-300 transition-colors hover:bg-gray-600"
                  :title="isCodeFolded(message.id) ? '展开' : '折叠'"
                >
                  <ChevronDown v-if="!isCodeFolded(message.id)" class="h-3 w-3" />
                  <ChevronRight v-else class="h-3 w-3" />
                </button>
                <!-- 消息操作按钮 -->
                <div class="flex gap-1">
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
              <!-- JSON模式 - DeepSeek风格 -->
              <div
                v-show="!isCodeFolded(message.id) && previewMode === 'json'"
                class="group relative"
              >
                <!-- 代码块头部 -->
                <div
                  class="absolute left-0 right-0 top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500">
                      <Code class="h-3 w-3 text-white" />
                    </div>
                    <span class="text-sm font-semibold">JSON</span>
                    <span class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400">格式化</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      @click="copyCode(formatJsonContent(message.content), 'json')"
                      class="group rounded-lg p-2 transition-colors hover:bg-gray-700"
                      title="复制代码"
                    >
                      <Copy class="h-4 w-4 group-hover:text-blue-400" />
                    </button>
                    <button
                      @click="downloadCode(formatJsonContent(message.content), 'json')"
                      class="group rounded-lg p-2 transition-colors hover:bg-gray-700"
                      title="下载代码"
                    >
                      <Download class="h-4 w-4 group-hover:text-green-400" />
                    </button>
                  </div>
                </div>
                <pre
                  class="overflow-x-auto rounded-b-xl border border-gray-200 bg-gray-50 p-6 pt-16 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  :style="{
                    fontSize: settingsStore.settings.fontSize + 'px',
                    fontFamily:
                      settingsStore.settings.chatFont || 'Fira Code, Monaco, Consolas, monospace',
                  }"
                ><code class="language-json">{{ formatJsonContent(message.content) }}</code></pre>
              </div>

              <!-- Markdown模式 - DeepSeek风格 -->
              <div
                v-show="!isCodeFolded(message.id) && previewMode === 'md'"
                class="prose prose-sm max-w-none overflow-x-auto rounded-xl border border-gray-200 bg-white p-6 text-sm dark:border-gray-700 dark:bg-gray-800"
                :style="{
                  fontSize: settingsStore.settings.fontSize + 'px',
                  fontFamily: settingsStore.settings.chatFont,
                }"
                v-html="formatMessageContent(message.content)"
              ></div>
            </div>

            <!-- 时间戳 - DeepSeek风格 -->
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

    <!-- 输入区域 - DeepSeek风格 -->
    <div
      class="border-t border-gray-200 bg-white/70 p-6 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/70"
    >
      <!-- 工具栏 -->
      <div class="mb-4 flex items-center gap-3">
        <button
          class="group rounded-xl p-3 transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Camera class="h-5 w-5 text-gray-600 group-hover:text-blue-500 dark:text-gray-300" />
        </button>
        <button
          class="group rounded-xl p-3 transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Image class="h-5 w-5 text-gray-600 group-hover:text-blue-500 dark:text-gray-300" />
        </button>
        <button
          class="group rounded-xl p-3 transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FileText class="h-5 w-5 text-gray-600 group-hover:text-blue-500 dark:text-gray-300" />
        </button>
        <div class="flex-1"></div>
        <button
          @click="createNewChat"
          class="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {{ $t('chat.newChat') }}
        </button>
      </div>

      <!-- 输入框 -->
      <div class="flex items-end gap-3">
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
  import { ref, computed, nextTick, watch, onMounted } from 'vue'
  import {
    Edit3,
    Link,
    Copy,
    MoreVertical,
    Camera,
    Image,
    FileText,
    RotateCcw,
    Trash2,
    ChevronDown,
    ChevronRight,
    Download,
    Code,
  } from 'lucide-vue-next'
  import { useChatStore } from '@/stores/chat'
  import { useSettingsStore } from '@/stores/settings'
  import { useApiStore } from '@/stores/api'
  import { ElMessage } from 'element-plus'
  import { formatMessageContent, isJsonString } from '@/utils/markdown'
  import type { Message } from '@/stores/chat'
  import hljs from 'highlight.js'

  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()
  const apiStore = useApiStore()
  const inputMessage = ref('')

  // 消息容器引用，用于自动滚动
  const messagesContainer = ref<HTMLElement>()

  // 预览模式状态
  const previewMode = ref<'json' | 'md'>('md')

  // 打字消息状态
  const typingMessages = ref<Set<string>>(new Set())

  // 代码折叠状态
  const foldedCodeBlocks = ref<Set<string>>(new Set())

  const currentConversation = computed(() => chatStore.currentConversation)

  // 检测文本中是否包含代码块
  const hasCodeBlock = (content: string): boolean => {
    return (
      content.includes('```') ||
      content.includes('`') ||
      content.includes('function') ||
      content.includes('const ')
    )
  }

  // 提取并格式化代码块
  const extractCodeBlocks = (content: string): Array<{ code: string; language: string }> => {
    const codeBlocks: Array<{ code: string; language: string }> = []
    const regex = /```(\w*)\n([\s\S]*?)```/g
    let match

    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'javascript',
        code: match[2].trim(),
      })
    }

    return codeBlocks
  }

  // 自动滚动到底部函数
  const scrollToBottom = async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }

  // 监听消息变化，自动滚动到底部
  watch(
    () => currentConversation.value?.messages.length,
    () => {
      scrollToBottom()
      nextTick(() => hljs.highlightAll())
    },
    { flush: 'post' }
  )

  // 预览模式切换函数
  const setPreviewMode = (mode: 'json' | 'md') => {
    previewMode.value = mode
  }

  // JSON内容格式化函数
  const formatJsonContent = (content: string): string => {
    try {
      // 尝试解析并重新格式化JSON
      const parsed = JSON.parse(content)
      return JSON.stringify(parsed, null, 2)
    } catch (error) {
      // 如果不是有效的JSON，返回原始内容
      return content
    }
  }

  // 代码复制函数
  const copyCode = async (code: string, language = 'javascript') => {
    try {
      await navigator.clipboard.writeText(code)
      ElMessage.success(`${language.toUpperCase()} 代码已复制到剪贴板`)
    } catch (error) {
      console.error('复制失败:', error)
      ElMessage.error('复制失败，请手动复制')
    }
  }

  // 代码下载函数
  const downloadCode = (code: string, language = 'javascript') => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `code.${language}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success(`${language.toUpperCase()} 代码已下载`)
  }

  // 代码折叠相关函数
  const toggleCodeFold = (messageId: string) => {
    if (foldedCodeBlocks.value.has(messageId)) {
      foldedCodeBlocks.value.delete(messageId)
    } else {
      foldedCodeBlocks.value.add(messageId)
    }
  }

  const isCodeFolded = (messageId: string): boolean => {
    return foldedCodeBlocks.value.has(messageId)
  }

  // 消息操作函数
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

          // 更新最后一条消息信息
          if (conversation.messages.length > 0) {
            const lastMsg = conversation.messages[conversation.messages.length - 1]
            conversation.lastMessage =
              lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : '')
            conversation.timestamp = new Date().toLocaleString('zh-CN')
          } else {
            // 如果没有消息了，重置最后消息信息
            conversation.lastMessage = ''
            conversation.timestamp = new Date().toLocaleString('zh-CN')
          }

          // 更新localStorage
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

    // 找到这条AI消息对应的用户消息（前一条）
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

      // 删除原来的AI回复
      conversation.messages.splice(messageIndex, 1)

      // 重新发送请求
      const aiResponse = await apiStore.sendMessage(
        conversation.messages,
        settingsStore.settings.model,
        {
          temperature: settingsStore.settings.temperature,
          presencePenalty: settingsStore.settings.presencePenalty || 0,
          frequencyPenalty: settingsStore.settings.frequencyPenalty || 0,
          topP: settingsStore.settings.topP,
        }
      )

      // 添加新的AI回复
      const retryLocale =
        settingsStore.settings.language === 'zh'
          ? 'zh-CN'
          : settingsStore.settings.language === 'ko'
            ? 'ko-KR'
            : 'en-US'
      const newAiMessage: Message = {
        id: Date.now().toString(),
        content: aiResponse,
        type: 'text',
        timestamp: new Date().toLocaleString(retryLocale),
        sender: 'assistant',
        model: settingsStore.settings.model,
      }

      // 在原来位置插入新消息
      conversation.messages.splice(messageIndex, 0, newAiMessage)

      // 更新最后一条消息信息
      if (conversation.messages.length > 0) {
        const lastMsg = conversation.messages[conversation.messages.length - 1]
        conversation.lastMessage =
          lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : '')
        conversation.timestamp = new Date().toLocaleString('zh-CN')
      }

      // 更新localStorage
      localStorage.setItem('nextchat-conversations', JSON.stringify(chatStore.conversations))

      ElMessage.success('重试成功')
    } catch (error) {
      console.error('重试失败:', error)
      ElMessage.error('重试失败，请稍后重试')
    }
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

  const sendMessage = () => {
    if (!inputMessage.value.trim()) return

    const userLocale =
      settingsStore.settings.language === 'zh'
        ? 'zh-CN'
        : settingsStore.settings.language === 'ko'
          ? 'ko-KR'
          : 'en-US'
    const message: Message = {
      id: Date.now().toString(),
      content: inputMessage.value,
      type: 'text',
      timestamp: new Date().toLocaleString(userLocale),
      sender: 'user',
    }

    chatStore.addMessage(chatStore.currentConversationId, message)
    inputMessage.value = ''

    setTimeout(() => {
      let aiContent =
        settingsStore.settings.language === 'zh'
          ? '这是AI助手的回复消息。'
          : 'This is a reply from the AI assistant.'
      let messageType: 'text' | 'code' = 'text'

      const lastUserMsg =
        currentConversation.value?.messages.filter((m) => m.sender === 'user').slice(-1)[0]
          ?.content || ''

      if (/js\s*数组\s*去重/i.test(lastUserMsg) || /JavaScript.*去重/.test(lastUserMsg)) {
        aiContent = [
          '好的，以下是 JavaScript 数组去重的常见方法，并附示例与优缺点：',
          '',
          '一、推荐方法',
          '',
          '1) 使用 Set（最简洁，ES6+）',
          '',
          '```javascript',
          'const original = [1, 2, 2, 3, 4, 4, 5, "a", "a", "b"]',
          'const unique = [...new Set(original)]',
          'console.log(unique) // [1,2,3,4,5,"a","b"]',
          '```',
          '',
          '优点：语义清晰、性能好、代码短。缺点：仅对基本类型有效；对象引用不同视为不同元素。',
          '',
          '2) 使用 Array.from + Set（同上）',
          '',
          '```javascript',
          'const unique = Array.from(new Set(original))',
          '```',
          '',
          '二、经典方法',
          '',
          '3) filter + indexOf',
          '',
          '```javascript',
          'const unique = original.filter((item, index) => original.indexOf(item) === index)',
          '```',
          '',
          '4) reduce + Map（支持按键去重，适合对象数组）',
          '',
          '```javascript',
          'const arr = [',
          '  { id: 1, name: "A" },',
          '  { id: 2, name: "B" },',
          '  { id: 1, name: "A2" }',
          ']',
          'const uniqueById = [...arr.reduce((map, item) => map.set(item.id, item), new Map()).values()]',
          'console.log(uniqueById) // 根据 id 去重',
          '```',
          '',
          '5) 临时对象/Set 记录（适合基本类型）',
          '',
          '```javascript',
          'const seen = new Set()',
          'const unique = []',
          'for (const v of original) {',
          '  if (!seen.has(v)) { seen.add(v); unique.push(v) }',
          '}',
          '```',
          '',
          '三、特殊场景',
          '',
          '6) 对象深度值去重（以 JSON 字符串为键，简便但有序列化开销）',
          '',
          '```javascript',
          'const arr = [{a:1},{a:1},{a:2}]',
          'const uniqueDeep = Array.from(new Map(arr.map(x => [JSON.stringify(x), x])).values())',
          '```',
          '',
          '7) 先排序再去重（适合大数据但需要排序）',
          '',
          '```javascript',
          'const sorted = [...original].sort()',
          'const uniqueSorted = sorted.filter((v, i) => i === 0 || v !== sorted[i-1])',
          '```',
          '',
          '选择建议：',
          '- 基本类型：优先 Set',
          '- 对象数组按键：Map/对象字典',
          '- 深比较：JSON 序列化或第三方库（如 lodash uniqWith）',
          '',
          '希望对你有帮助！如果需要性能对比或适配更复杂数据结构，我可以继续完善示例。',
        ].join('\n')
        messageType = 'text'
      } else if (settingsStore.settings.enableArtifacts && Math.random() > 0.5) {
        aiContent = JSON.stringify(
          {
            name: '示例项目',
            version: '1.0.0',
            description: '这是一个示例JSON响应',
            features: ['功能1', '功能2', '功能3'],
            config: {
              enabled: true,
              timeout: 3000,
              retries: 3,
            },
          },
          null,
          2
        )
        messageType = 'code'
      }

      const aiLocale =
        settingsStore.settings.language === 'zh'
          ? 'zh-CN'
          : settingsStore.settings.language === 'ko'
            ? 'ko-KR'
            : 'en-US'
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        type: messageType,
        timestamp: new Date().toLocaleString(aiLocale),
        sender: 'assistant',
      }
      chatStore.addMessage(chatStore.currentConversationId, aiMessage)
    }, 800)
  }

  const addNewLine = () => {
    inputMessage.value += '\n'
  }

  const createNewChat = () => {
    chatStore.createNewConversation()
  }

  onMounted(() => {
    nextTick(() => hljs.highlightAll())
    if (!currentConversation.value?.messages.length) {
      inputMessage.value = 'js数组去重方法有哪些'
      sendMessage()
    }
  })
</script>
