<template>
  <div class="flex min-h-0 flex-1 flex-col bg-gray-50 dark:bg-gray-900">
    <!-- 消息显示区域 - 使用flex-1和min-h-0确保内容溢出时能正确滚动 -->
    <div ref="messagesContainer" class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div class="mx-auto max-w-3xl space-y-8">
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
          v-for="message in currentConversation?.messages.filter((msg) => msg.sender !== 'system')"
          :key="message.id"
          class="message-item relative flex flex-col gap-4"
        >
          <!-- 消息内容 -->
          <div :class="['flex', message.sender === 'user' ? 'justify-end' : 'justify-start']">
            <!-- 消息气泡容器 -->
            <div
              :class="['group max-w-3xl']"
              :style="message.sender === 'assistant' ? { marginLeft: '0', paddingLeft: '0' } : {}"
            >
              <!-- 文本消息 -->
              <template v-if="message.type === 'text'">
                <!-- 消息气泡 -->
                <div
                  :class="[
                    'max-w-2xl rounded-lg py-2',
                    message.sender === 'user'
                      ? 'px-2 text-right'
                      : 'bg-gray-100 px-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
                  ]"
                  :style="{
                    fontSize: settingsStore.settings.fontSize + 'px',
                    fontFamily: settingsStore.settings.chatFont,
                  }"
                >
                  <div v-html="formatMessage(message.content)"></div>
                </div>
                <!-- 消息操作按钮 - 根据发送者位置调整 -->
                <div
                  :class="[
                    'mt-1 flex items-center gap-1 text-xs transition-opacity duration-200',
                    message.sender === 'user'
                      ? 'justify-end text-gray-700 dark:text-gray-300'
                      : 'justify-start text-gray-500 dark:text-gray-400',
                  ]"
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
                    :class="[
                      'rounded-md p-1.5',
                      message.sender === 'user'
                        ? 'bg-white/20 hover:bg-white/30'
                        : 'hover:bg-black/10 dark:hover:bg-white/10',
                    ]"
                    title="复制"
                  >
                    <Copy class="h-3.5 w-3.5" />
                  </button>
                  <button
                    @click="deleteMessage(message.id)"
                    :class="[
                      'rounded-md p-1.5',
                      message.sender === 'user'
                        ? 'bg-white/20 hover:bg-white/30'
                        : 'hover:bg-black/10 dark:hover:bg-white/10',
                    ]"
                    title="删除"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </template>

              <!-- 代码块消息 -->
              <template v-else-if="message.type === 'code'">
                <!-- 代码块容器 -->
                <div
                  class="code-block-container overflow-hidden bg-gray-50 dark:bg-gray-800"
                  :style="{
                    fontSize: settingsStore.settings.fontSize + 'px',
                    fontFamily: settingsStore.settings.chatFont,
                    borderRadius: '8px',
                  }"
                >
                  <!-- 代码块头部信息栏 -->
                  <div
                    class="dark:bg-gray-850 flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-gray-700"
                  >
                    <!-- 语言标签 -->
                    <div class="font-mono text-sm text-gray-600 dark:text-gray-300">
                      <span class="text-xs opacity-70">javascript</span>
                    </div>

                    <!-- 代码操作按钮 -->
                    <div class="flex items-center gap-3">
                      <button
                        class="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="复制代码"
                        @click="copyCodeBlock(message)"
                      >
                        <Copy class="h-4 w-4" />
                        <span>复制</span>
                      </button>
                      <button
                        class="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="下载代码"
                        @click="downloadCodeBlock(message)"
                      >
                        <FileText class="h-4 w-4" />
                        <span>下载</span>
                      </button>
                    </div>
                  </div>

                  <!-- 代码内容 -->
                  <div class="max-w-none overflow-x-auto whitespace-pre p-4 text-sm">
                    <div
                      class="whitespace-pre break-words"
                      v-html="formatMessage(message.content)"
                    ></div>
                  </div>
                </div>

                <!-- 消息操作按钮 - 根据发送者位置调整 -->
                <div
                  :class="[
                    'mt-1 flex items-center gap-1 text-xs transition-opacity duration-200',
                    message.sender === 'user'
                      ? 'justify-end text-gray-700 dark:text-gray-300'
                      : 'justify-start text-gray-500 dark:text-gray-400',
                  ]"
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
                    :class="[
                      'rounded-md p-1.5',
                      message.sender === 'user'
                        ? 'bg-white/20 hover:bg-white/30'
                        : 'hover:bg-black/10 dark:hover:bg-white/10',
                    ]"
                    title="复制"
                  >
                    <Copy class="h-3.5 w-3.5" />
                  </button>
                  <button
                    @click="deleteMessage(message.id)"
                    :class="[
                      'rounded-md p-1.5',
                      message.sender === 'user'
                        ? 'bg-white/20 hover:bg-white/30'
                        : 'hover:bg-black/10 dark:hover:bg-white/10',
                    ]"
                    title="删除"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </template>

              <!-- 时间戳 -  -->
              <div
                class="m-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
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
      <div class="flex-1">
        <div class="relative">
          <textarea
            v-model="inputMessage"
            ref="textareaRef"
            @keydown="handleKeyDown"
            @input="autoResizeTextarea"
            @focus="autoResizeTextarea"
            :placeholder="$t('chat.typeMessage')"
            class="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 pr-14 transition-all duration-300 ease-in-out focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200"
            rows="1"
            style="
              min-height: 100px;
              max-height: 200px;
              overflow-y: auto;
              transition: height 0.3s ease-in-out;
            "
          ></textarea>
          <div class="absolute bottom-3 right-14 flex items-center gap-2">
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {{ settingsStore.settings.sendMode === 'enter' ? 'Enter' : 'Ctrl+Enter' }}
            </span>
          </div>
          <button
            @click="sendMessage"
            :disabled="!inputMessage.trim()"
            class="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-md transition-all duration-200 ease-in-out hover:scale-105 hover:bg-blue-600 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
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
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { marked } from 'marked'
  import hljs from 'highlight.js'
  import DOMPurify from 'dompurify'
  // 导入highlight.js样式
  import 'highlight.js/styles/github-dark.css' // 使用暗色主题样式，适配深色模式

  // 全局类型声明
  declare global {
    interface Window {
      copyCode: (button: HTMLElement) => void
    }
  }

  // 配置 marked，移到顶部确保在formatMessage函数调用前完成配置
  marked.setOptions({
    breaks: true, // 支持换行符（\n）转为 <br>
    gfm: true, // 支持 GitHub 风格的 Markdown（表格、任务列表等）
    langPrefix: 'hljs language-', // 为代码块添加正确的CSS类前缀
    headerIds: false, // 禁用标题ID生成
    mangle: false, // 禁用文本混淆
    smartLists: true, // 启用智能列表格式
    smartypants: true, // 启用智能标点符号（引号、破折号等）
    tables: true, // 确保表格支持
    taskLists: true, // 确保任务列表支持
  } as any)

  // 为marked添加高亮处理
  const highlightCode = (code: string, lang?: string) => {
    // 确保使用正确的语言高亮
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    try {
      return hljs.highlight(code, { language }).value
    } catch (err) {
      console.error('代码高亮失败:', err)
      return hljs.highlightAuto(code).value
    }
  }

  // 使用type assertion处理marked配置
  ;(marked as any).setOptions({
    highlight: highlightCode,
    breaks: true,
    gfm: true,
    langPrefix: 'hljs language-',
    headerIds: false,
    mangle: false,
    smartLists: true,
    smartypants: true,
    tables: true,
    taskLists: true,
  })

  const { t } = useI18n()
  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()
  const apiStore = useApiStore()
  const inputMessage = ref('')
  const typingMessages = ref<Set<string>>(new Set())
  const messagesContainer = ref<HTMLElement | null>(null)
  const textareaRef = ref<HTMLTextAreaElement | null>(null)

  const currentConversation = computed(() => chatStore.currentConversation)

  // 统一的消息格式化函数
  const formatMessage = (content: string): string => {
    // 预处理：确保换行符正确转换为\n
    // 规范化换行符：将Windows风格(\r\n)和Mac风格(\r)统一转换为Unix风格(\n)
    let normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // 使用 marked 解析 Markdown，确保代码高亮
    let parsedContent = marked.parse(normalizedContent) as string

    // 使用 DOMPurify 进行 XSS 防护，并将返回值转换为string类型
    parsedContent = String(
      DOMPurify.sanitize(parsedContent, {
        ADD_TAGS: [
          'span',
          'button',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'table',
          'thead',
          'tbody',
          'tr',
          'td',
          'th',
          'blockquote',
          'ul',
          'ol',
          'li',
        ],
        ADD_ATTR: ['onclick', 'class', 'title'],
      } as any)
    )

    // 在代码块右上角添加复制按钮，并在左上角显示代码类型
    // 为表格添加水平滚动容器
    parsedContent = parsedContent.replace(/<table>([\s\S]*?)<\/table>/g, (match, tableContent) => {
      return `<div class="table-container mobile-scrollable">
          <table>${tableContent}</table>
        </div>`
    })

    // 处理代码块
    parsedContent = parsedContent.replace(
      /<pre><code class="([^"]*)">([\s\S]*?)<\/code><\/pre>/g,
      (match, languageClass, codeContent) => {
        // 提取语言类型，通常格式为 'language-javascript' 或 'javascript'
        let language = 'plaintext'
        if (languageClass) {
          // 处理可能的 'language-' 前缀
          language = languageClass.replace(/^language-/, '')
          // 提取出第一个非空字符串作为语言类型
          if (language) {
            // 处理多个类名的情况，取第一个可能的语言类
            const langMatch = language.match(/^[a-zA-Z0-9]+/)
            if (langMatch) {
              language = langMatch[0]
            }
          }
        }

        return `<div class="code-block-wrapper relative mobile-scrollable rounded-lg overflow-hidden">
          <div class="code-header flex justify-between items-center p-2 bg-gray-800 text-xs text-gray-400 rounded-t-lg">
            <span class="language-label">${language}</span>
            <button class="copy-button rounded bg-gray-700 p-1 text-gray-300 hover:bg-gray-600" onclick="copyCode(this)" title="复制代码">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>
          <pre class="rounded-b-lg"><code class="${languageClass}">${codeContent}</code></pre>
        </div>`
      }
    )

    return parsedContent
  }

  // 全局复制代码函数
  window.copyCode = function (button: HTMLElement) {
    const codeBlockWrapper = button.closest('.code-block-wrapper')
    if (codeBlockWrapper) {
      const codeElement = codeBlockWrapper.querySelector('code')
      if (codeElement) {
        const codeText = codeElement.innerText
        navigator.clipboard.writeText(codeText).then(() => {
          // 显示复制成功的提示
          const originalHTML = button.innerHTML
          button.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>'
          setTimeout(() => {
            button.innerHTML = originalHTML
          }, 2000)
        })
      }
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

  const addNewLine = () => {
    inputMessage.value += '\n'
    // 添加新行后立即调整输入框高度
    nextTick(() => {
      autoResizeTextarea()
    })
  }

  // 自动调整输入框高度的方法
  const autoResizeTextarea = () => {
    const textarea = textareaRef.value
    if (!textarea) return

    // 重置高度以获取正确的scrollHeight
    textarea.style.height = 'auto'

    // 获取内容实际高度
    const scrollHeight = textarea.scrollHeight

    // 设置新高度，但不超过最大高度限制
    const maxHeight = 200 // 与style中的max-height保持一致
    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px'
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
            // 每次内容更新时滚动到底部，确保流式消息实时可见
            scrollToBottom()
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

  // 复制代码块功能
  const copyCodeBlock = async (message: Message) => {
    try {
      // 从Markdown内容中提取纯代码
      // 假设内容格式为 ```javascript\ncode\n```
      const codeMatch = message.content.match(/```[\w]*\n([\s\S]*?)```/)
      const codeContent = codeMatch ? codeMatch[1] : message.content

      await navigator.clipboard.writeText(codeContent)
      ElMessage.success('代码已复制到剪贴板')
    } catch (error) {
      console.error('复制代码失败:', error)
      ElMessage.error('复制代码失败，请手动复制')
    }
  }

  // 下载代码块功能
  const downloadCodeBlock = (message: Message) => {
    try {
      // 从Markdown内容中提取纯代码和语言信息
      const codeMatch = message.content.match(/```([\w]*)\n([\s\S]*?)```/)
      const language = codeMatch && codeMatch[1] ? codeMatch[1] : 'text'
      const codeContent = codeMatch ? codeMatch[2] : message.content

      // 根据语言确定文件扩展名
      const extensionMap: Record<string, string> = {
        javascript: 'js',
        python: 'py',
        java: 'java',
        cpp: 'cpp',
        csharp: 'cs',
        html: 'html',
        css: 'css',
        json: 'json',
        xml: 'xml',
        sql: 'sql',
        bash: 'sh',
        powershell: 'ps1',
      }

      const extension = extensionMap[language] || 'txt'
      const fileName = `code-${Date.now()}.${extension}`

      // 创建Blob并下载
      const blob = new Blob([codeContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      ElMessage.success('代码已下载')
    } catch (error) {
      console.error('下载代码失败:', error)
      ElMessage.error('下载代码失败，请稍后重试')
    }
  }

  const deleteMessage = (messageId: string) => {
    // 使用Element Plus的MessageBox组件替代原生confirm
    ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true,
    })
      .then(() => {
        const conversation = currentConversation.value
        if (conversation) {
          const messageIndex = conversation.messages.findIndex((msg) => msg.id === messageId)
          if (messageIndex !== -1) {
            conversation.messages.splice(messageIndex, 1)

            if (conversation.messages.length > 0) {
              const lastMessage = conversation.messages[conversation.messages.length - 1]
              conversation.lastMessage =
                lastMessage.content.substring(0, 50) +
                (lastMessage.content.length > 50 ? '...' : '')
            } else {
              conversation.lastMessage = ''
            }

            localStorage.setItem('nextchat-conversations', JSON.stringify(chatStore.conversations))
            ElMessage.success('消息已删除')
          }
        }
      })
      .catch(() => {
        // 用户取消删除操作，不做任何处理
      })
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
            // 每次内容更新时滚动到底部，确保流式消息实时可见
            scrollToBottom()
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
        // 使用 scrollIntoView 方法，配合 smooth 选项实现更流畅的滚动效果
        // 找到最后一个消息元素
        const lastMessage = messagesContainer.value.querySelector('.message-item:last-child')
        if (lastMessage) {
          lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' })
        } else {
          // 备用方案：直接设置 scrollTop
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      }
    })
  }

  // 监听当前会话ID变化，确保切换聊天时自动滚动到底部
  watch(
    () => chatStore.currentConversationId,
    () => {
      scrollToBottom()
    }
  )

  // 监听消息变化，自动滚动到底部
  watch(
    () => currentConversation.value?.messages.length,
    () => {
      scrollToBottom()
    }
  )

  // 监听消息内容变化，确保代码高亮更新
  watch(
    () => currentConversation.value?.messages.map((m) => m.content),
    () => {
      nextTick(() => {
        // 强制重新渲染代码高亮
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block as HTMLElement)
        })
      })
    },
    { deep: true }
  )

  onMounted(() => {
    // 组件挂载时的其他初始化逻辑
    scrollToBottom()

    // 初始化时对已有代码块进行高亮处理
    nextTick(() => {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement)
      })
    })
  })

  // 监听输入消息变化，确保高度正确调整
  watch(inputMessage, () => {
    nextTick(() => {
      autoResizeTextarea()
    })
  })

  onUnmounted(() => {
    // 清理全局函数
  })
</script>

<style scoped>
  /* 代码块包装器样式 */
  .code-block-wrapper {
    border-radius: 8px;
    overflow: hidden;
    margin: 1em 0;
  }

  /* 代码头部样式（包含语言标签和复制按钮） */
  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5em 1em;
    background-color: #1f2937; /* 深色背景 */
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  /* 语言标签样式 */
  .language-label {
    font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* 深色模式适配 */
  :global(.dark) .code-header {
    background-color: #111827;
  }

  :global(.dark) .language-label {
    color: #9ca3af;
  }

  /* 浅色模式适配 */
  :global(.light) .code-header {
    background-color: #f3f4f6;
  }

  :global(.light) .language-label {
    color: #4b5563;
  }

  /* 确保pre标签正确继承圆角并允许水平滚动 */
  .code-block-wrapper pre {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    margin: 0;
    overflow-x: auto;
    white-space: pre;
  }

  /* 确保消息内容中的文本自动换行 */
  :deep(p),
  :deep(div:not(.code-block-wrapper, .table-container, .mobile-scrollable)) {
    overflow-wrap: break-word;
    hyphens: auto;
  }

  /* 复制按钮样式 */
  .copy-button {
    background-color: rgba(55, 65, 81, 0.8); /* bg-gray-700 with opacity */
    color: rgb(209, 213, 219); /* text-gray-300 */
    border-radius: 0.25rem; /* rounded */
    padding: 0.25rem;
    transition: background-color 0.2s ease;
  }

  .copy-button:hover {
    background-color: rgba(75, 85, 99, 0.8); /* bg-gray-600 with opacity */
  }
</style>

<style scoped>
  /* Markdown 样式优化 */
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    line-height: 1.25;
  }

  :deep(h1) {
    font-size: 1.75rem;
  }
  :deep(h2) {
    font-size: 1.5rem;
  }
  :deep(h3) {
    font-size: 1.25rem;
  }
  :deep(h4) {
    font-size: 1.125rem;
  }
  :deep(h5) {
    font-size: 1rem;
  }
  :deep(h6) {
    font-size: 0.875rem;
  }

  /* 表格样式 */
  :deep(table) {
    border-collapse: collapse;
    min-width: 100%;
    margin: 1rem 0;
  }

  /* 为表格添加水平滚动容器 */
  :deep(.table-container) {
    overflow-x: auto;
    margin: 1rem 0;
    -webkit-overflow-scrolling: touch; /* 添加移动端平滑滚动 */
  }

  :deep(th),
  :deep(td) {
    border: 1px solid #e5e7eb;
    padding: 0.5rem 0.75rem;
    text-align: left;
    white-space: nowrap; /* 表格单元格不换行 */
  }

  :deep(th) {
    background-color: #f3f4f6;
    font-weight: 600;
  }

  :deep(tr:nth-child(even)) {
    background-color: #f9fafb;
  }

  /* 深色模式样式适配 */
  :global(.dark) :deep(th),
  :global(.dark) :deep(td) {
    border-color: #374151;
  }

  :global(.dark) :deep(th) {
    background-color: #1f2937;
  }

  :global(.dark) :deep(tr:nth-child(even)) {
    background-color: #111827;
  }

  /* 列表样式 */
  :deep(ul),
  :deep(ol) {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  :deep(li) {
    margin: 0.25rem 0;
  }

  /* 引用样式 */
  :deep(blockquote) {
    border-left: 4px solid #3b82f6;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #4b5563;
    font-style: italic;
  }

  :global(.dark) :deep(blockquote) {
    color: #9ca3af;
  }

  /* 移动端优化 */
  @media (max-width: 768px) {
    :deep(.table-container) {
      max-width: calc(100vw - 0.5rem);
      margin: 1rem auto;
      padding: 0 0.25rem;
    }

    :deep(.code-block-wrapper) {
      max-width: calc(100vw - 0.5rem);
      margin: 1rem auto;
      padding: 0 0.25rem;
      border-radius: 8px;
    }

    :deep(.code-header) {
      padding: 0.5rem 0.25rem;
    }

    :deep(pre) {
      max-width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    :deep(code) {
      white-space: pre;
    }

    /* 确保复制按钮在移动端可见 */
    :deep(.copy-button) {
      padding: 0.25rem;
      min-width: 32px;
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 新增类用于处理移动端滚动内容的边距 */
    :deep(.mobile-scrollable) {
      margin: 1rem auto;
      padding: 0 0.25rem;
    }

    /* 移动端输入框优化 - 与PC端保持一致的高度 */
    textarea {
      min-height: 100px !important;
      font-size: 16px !important; /* 防止iOS缩放 */
    }
  }

  /* 输入框相关样式优化 */
  textarea {
    /* 确保字体大小一致且易于阅读 */
    font-size: 1rem;
    line-height: 1.5;

    /* 确保文本在多行时垂直对齐 */
    vertical-align: top;

    /* 确保在获取焦点时不会出现额外的外边框 */
    box-sizing: border-box;
  }

  /* 确保在输入框高度变化时，底部信息区域也能平滑过渡 */
  .absolute.bottom-3.right-3 {
    transition: transform 0.3s ease-in-out;
  }
</style>
