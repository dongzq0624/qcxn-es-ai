<template>
  <div ref="chatContainerRef" class="flex-1 flex flex-col bg-white dark:bg-gray-800" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- 顶部工具栏 -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
      <div>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ currentConversation?.title || '新的聊天' }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">共 {{ currentConversation?.messages.length || 0 }} 条消息</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="clearCurrentChat" 
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="清除当前聊天"
        >
          <Trash2 class="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button 
          @click="exportToPNG" 
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="导出为PNG"
        >
          <Download class="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button 
          @click="toggleFullscreen" 
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :title="isFullscreen ? '退出全屏' : '全屏'"
        >
          <component :is="isFullscreen ? Minimize : Maximize" class="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>

    <!-- 消息显示区域 -->
    <div class="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
      <!-- 欢迎消息 -->
      <div v-if="!currentConversation?.messages.length" class="flex flex-col items-center justify-center h-full text-center">
        <div class="mb-8">
          <div class="text-6xl mb-4">🤖</div>
          <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">有什么可以帮助你的吗</h3>
          <p class="text-gray-500 dark:text-gray-400">开始一个新的对话，探索AI助手的强大功能</p>
        </div>
      </div>
      
      <div 
        v-for="message in currentConversation?.messages" 
        :key="message.id"
        class="flex flex-col gap-1 group"
      >
        <!-- 用户消息布局：头像 + 操作按钮 + 消息内容 -->
        <div v-if="message.sender === 'user'" class="flex flex-col gap-1 items-end">
          <!-- 用户头像 -->
          <div class="w-8 h-8 flex items-center justify-center text-lg mb-1">
            <div v-if="settingsStore.settings.avatar && settingsStore.settings.avatar.length <= 2">
              {{ settingsStore.settings.avatar }}
            </div>
            <User v-else class="w-5 h-5 text-blue-500" />
          </div>
          
          <!-- 消息内容和操作按钮同一行 -->
          <div class="flex items-center gap-2">
            <!-- 操作按钮在消息左侧 -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button 
                @click="copyMessage(message)"
                class="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="复制"
              >
                <Copy class="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                @click="deleteMessage(message.id)"
                class="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="删除"
              >
                <Trash2 class="w-3 h-3 text-red-500" />
              </button>
            </div>
            
            <!-- 消息内容 -->
            <div class="max-w-2xl">
              <div 
                v-if="message.type === 'text'" 
                class="px-4 py-3 rounded-2xl bg-blue-500 text-white"
              >
                {{ message.content }}
              </div>
              <div v-else-if="message.type === 'code'" class="relative">
                <div class="absolute top-2 right-2 z-10">
                  <span class="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">JSON</span>
                </div>
                <pre class="bg-gray-900 dark:bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>{{ message.content }}</code></pre>
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                {{ message.timestamp }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- AI消息布局：模型标签 + 操作按钮 + 消息内容 -->
        <div v-else-if="message.sender === 'assistant'" class="flex flex-col gap-1 items-start">
          <!-- 模型标签和操作按钮同一行 -->
          <div class="flex items-center gap-2 mb-1">
            <!-- 具体模型名称 -->
            <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              {{ message.model === 'deepseek' ? 'DeepSeek' : (message.model || 'GPT-3.5') }}
            </span>
            
            <!-- 操作按钮在模型名称右侧 -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button 
                @click="retryMessage(message)"
                class="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="重试"
              >
                <RotateCcw class="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                @click="copyMessage(message)"
                class="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="复制"
              >
                <Copy class="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                @click="deleteMessage(message.id)"
                class="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="删除"
              >
                <Trash2 class="w-3 h-3 text-red-500" />
              </button>
            </div>
          </div>
          
          <!-- 消息内容 -->
          <div class="max-w-2xl">
            <div 
              v-if="message.type === 'text'" 
              class="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              <!-- 消息内容 -->
              <span v-if="message.content">{{ message.content }}</span>
              
              <!-- 加载状态指示器 -->
              <div v-if="typingMessages.has(message.id) && !message.content" class="flex items-center gap-2">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                <span class="text-sm text-gray-500 ml-2">思考中...</span>
              </div>
              
              <!-- 打字效果光标 -->
              <span v-if="typingMessages.has(message.id) && message.content" class="inline-block w-1 h-4 bg-current ml-1 animate-pulse"></span>
            </div>
            <div v-else-if="message.type === 'code'" class="relative">
              <div class="absolute top-2 right-2 z-10">
                <span class="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">JSON</span>
              </div>
              <pre class="bg-gray-900 dark:bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>{{ message.content }}</code></pre>
            </div>
            <div class="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
              {{ message.timestamp }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="border-t border-gray-200 dark:border-gray-600 p-4">
      <!-- 输入框 -->
      <div class="flex items-end gap-2">
        <textarea
          v-model="inputMessage"
          @keydown="handleKeyDown"
          :placeholder="'Enter 发送，Shift + Enter 换行，/ 查看命令，粘贴图片'"
          class="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          rows="1"
        ></textarea>
        <button 
          @click="sendMessage"
          class="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors font-medium shadow-lg"
        >
          发送
        </button>
      </div>

      <!-- 提示文字 -->
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {{ settingsStore.settings.sendMode === 'enter' ? 'Enter 发送' : 'Ctrl + Enter 发送' }}, Shift + Enter 换行
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Edit3, Link, Copy, MoreVertical, Camera, Image, FileText, Download, Maximize, Minimize, Trash2, RotateCcw, User, Bot } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import { useApiStore } from '@/stores/api'
import { useI18n } from 'vue-i18n'
import type { Message } from '@/stores/chat'
import { ElMessage } from 'element-plus'
import Typewriter from '@/components/Typewriter.vue'
import * as htmlToImage from 'html-to-image'

const { t } = useI18n()
const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const apiStore = useApiStore()
const inputMessage = ref('')
const typingMessages = ref<Set<string>>(new Set()) // 正在打字的消息ID
const isFullscreen = ref(false) // 全屏状态
const chatContainerRef = ref<HTMLElement>() // 聊天容器引用

const currentConversation = computed(() => chatStore.currentConversation)

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  const message: Message = {
    id: Date.now().toString(),
    content: inputMessage.value,
    type: 'text',
    timestamp: new Date().toLocaleString(settingsStore.settings.language === 'zh' ? 'zh-CN' : 'en-US'),
    sender: 'user',
    model: settingsStore.settings.model // 记录使用的模型
  }

  chatStore.addMessage(chatStore.currentConversationId, message)
  inputMessage.value = ''

  try {
    // 获取当前对话的所有消息（包括刚添加的用户消息）
    const currentConversation = chatStore.currentConversation
    if (!currentConversation) return

    // 创建AI消息占位符，用于显示加载状态和流式内容
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: Message = {
      id: aiMessageId,
      content: '', // 初始内容为空
      type: 'text',
      timestamp: new Date().toLocaleString(settingsStore.settings.language === 'zh' ? 'zh-CN' : 'en-US'),
      sender: 'assistant',
      model: settingsStore.settings.model // 记录使用的模型
    }
    
    // 添加AI消息到对话中
    chatStore.addMessage(chatStore.currentConversationId, aiMessage)
    
    // 将AI消息添加到正在打字的集合中
    typingMessages.value.add(aiMessageId)

    let fullContent = ''
    
    // 调用流式API
    await apiStore.sendStreamingMessage(
      currentConversation.messages,
      settingsStore.settings.model,
      {
        temperature: settingsStore.settings.temperature,
        presencePenalty: settingsStore.settings.presencePenalty || 0,
        frequencyPenalty: settingsStore.settings.frequencyPenalty || 0,
        topP: settingsStore.settings.topP
      },
      (chunk: string) => {
        // 处理流式响应的每个片段
        fullContent += chunk
        
        // 更新AI消息的内容
        const messageIndex = currentConversation.messages.findIndex(msg => msg.id === aiMessageId)
        if (messageIndex !== -1) {
          currentConversation.messages[messageIndex].content = fullContent
        }
      }
    )

    // 完成流式响应后，从正在打字的集合中移除
    typingMessages.value.delete(aiMessageId)

  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请稍后重试')
    
    // 添加错误消息
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
      type: 'text',
      timestamp: new Date().toLocaleString(settingsStore.settings.language === 'zh' ? 'zh-CN' : 'en-US'),
      sender: 'assistant'
    }
    chatStore.addMessage(chatStore.currentConversationId, errorMessage)
  }
}

// 清除当前聊天内容
const clearCurrentChat = () => {
  if (!currentConversation.value) return
  
  if (currentConversation.value.messages.length === 0) {
    ElMessage.info('当前聊天已经是空的')
    return
  }
  
  // 确认清除
  if (confirm('确定要清除当前聊天的所有内容吗？此操作不可恢复。')) {
    // 清除当前对话的所有消息
    currentConversation.value.messages = []
    currentConversation.value.lastMessage = ''
    
    // 保存到localStorage
    localStorage.setItem('nextchat-conversations', JSON.stringify(chatStore.conversations))
    
    ElMessage.success('聊天内容已清除')
  }
}

const addNewLine = () => {
  inputMessage.value += '\n'
}

const createNewChat = () => {
  chatStore.createNewConversation()
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
      const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId)
      if (messageIndex !== -1) {
        conversation.messages.splice(messageIndex, 1)
        
        // 更新对话的最后消息和摘要
        if (conversation.messages.length > 0) {
          const lastMessage = conversation.messages[conversation.messages.length - 1]
          conversation.lastMessage = lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '')
        } else {
          conversation.lastMessage = ''
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
  const messageIndex = conversation.messages.findIndex(msg => msg.id === message.id)
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
    
    // 创建新的AI消息占位符
    const newAiMessageId = Date.now().toString()
    const newAiMessage: Message = {
      id: newAiMessageId,
      content: '', // 初始内容为空
      type: 'text',
      timestamp: new Date().toLocaleString(settingsStore.settings.language === 'zh' ? 'zh-CN' : 'en-US'),
      sender: 'assistant',
      model: settingsStore.settings.model
    }
    
    // 在原来位置插入新消息
    conversation.messages.splice(messageIndex, 0, newAiMessage)
    
    // 将AI消息添加到正在打字的集合中
    typingMessages.value.add(newAiMessageId)
    
    let fullContent = ''
    
    // 使用流式API重新发送请求
    await apiStore.sendStreamingMessage(
      conversation.messages,
      settingsStore.settings.model,
      {
        temperature: settingsStore.settings.temperature,
        presencePenalty: settingsStore.settings.presencePenalty || 0,
        frequencyPenalty: settingsStore.settings.frequencyPenalty || 0,
        topP: settingsStore.settings.topP
      },
      (chunk: string) => {
        // 处理流式响应的每个片段
        fullContent += chunk
        
        // 更新AI消息的内容
        const msgIndex = conversation.messages.findIndex(msg => msg.id === newAiMessageId)
        if (msgIndex !== -1) {
          conversation.messages[msgIndex].content = fullContent
        }
      }
    )
    
    // 完成流式响应后，从正在打字的集合中移除
    typingMessages.value.delete(newAiMessageId)
    
    // 更新最后一条消息信息
    if (conversation.messages.length > 0) {
      const lastMsg = conversation.messages[conversation.messages.length - 1]
      conversation.lastMessage = lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : '')
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

// 导出为PNG功能
const exportToPNG = async () => {
  try {
    // 获取消息显示区域
    const messageArea = document.querySelector('.flex-1.overflow-y-auto.p-6') as HTMLElement
    if (!messageArea) {
      ElMessage.error('无法找到消息区域')
      return
    }

    // 显示加载提示
    ElMessage.info('正在生成图片...')

    // 生成PNG图片
    const dataUrl = await htmlToImage.toPng(messageArea, {
      backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
      width: messageArea.scrollWidth,
      height: messageArea.scrollHeight,
      pixelRatio: 2, // 提高图片质量
    })

    // 创建下载链接
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

// 全屏功能（仅针对聊天卡片）
const toggleFullscreen = () => {
  if (!chatContainerRef.value) return
  
  if (!isFullscreen.value) {
    // 进入全屏模式（模拟）
    isFullscreen.value = true
    // 添加全屏样式到根元素
    document.documentElement.classList.add('chat-fullscreen-mode')
  } else {
    // 退出全屏模式
    isFullscreen.value = false
    // 移除全屏样式
    document.documentElement.classList.remove('chat-fullscreen-mode')
  }
}

// ESC键退出全屏
const handleKeyDown = (event: KeyboardEvent) => {
  // ESC键退出全屏
  if (event.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen()
    return
  }
  
  // 原有的发送消息逻辑
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
/* 全屏模式样式 - 优化中间区域显示 */
:global(.chat-fullscreen-mode) {
  overflow: hidden;
}

/* 全屏模式下整个应用布局调整 */
:global(.chat-fullscreen-mode) .min-h-screen.flex.items-center.justify-center.p-4 {
  padding: 0 !important;
  background: #f9fafb !important;
  transition: all 0.3s ease-in-out;
  min-height: 100vh !important;
  align-items: stretch !important;
}

/* 全屏模式下主容器调整 */
:global(.chat-fullscreen-mode) .w-full.max-w-6xl.h-\[90vh\] {
  max-width: none !important;
  height: 100vh !important;
  border-radius: 0 !important;
  margin: 0 !important;
  box-shadow: none !important;
  transition: all 0.3s ease-in-out;
  display: flex !important;
  flex-direction: row !important;
}

/* 全屏模式优化 - 使中间区域充满屏幕 */
:global(.chat-fullscreen-mode) {
  overflow: hidden !important;
}

/* 全屏模式下移除卡片容器的最大宽度和边距 */
:global(.chat-fullscreen-mode) .w-full.max-w-6xl.h-\[90vh\] {
  max-width: none !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  border-radius: 0 !important;
}

/* 全屏模式下侧边栏样式优化 */
:global(.chat-fullscreen-mode) .fixed.lg\\:relative.z-50.h-full {
  height: 100vh !important;
  transition: all 0.3s ease-in-out;
}

/* 全屏模式下聊天区域最大化 */
:global(.chat-fullscreen-mode) .flex-1.flex.flex-col.min-w-0 {
  flex: 1 !important;
  min-width: 0 !important;
  height: 100vh !important;
  transition: all 0.3s ease-in-out;
}

/* 全屏模式下当前组件容器 */
.fullscreen-mode {
  flex: 1 !important;
  width: 100% !important;
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  transition: all 0.3s ease-in-out;
}

/* 全屏模式下消息区域最大化 - 关键优化 */
.fullscreen-mode .flex-1.overflow-y-auto.p-6 {
  flex: 1 !important;
  height: calc(100vh - 120px) !important; /* 减去顶部工具栏和输入区域的高度 */
  max-height: none !important;
  padding: 2rem 3rem !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 1.5rem !important;
  overflow-y: auto !important;
}

/* 全屏模式下的顶部工具栏样式 */
:global(.chat-fullscreen-mode) .flex.items-center.justify-between.p-4 {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5) !important;
  padding: 1rem 3rem !important;
  height: 60px !important; /* 固定高度 */
  flex-shrink: 0 !important;
}

/* 全屏模式下输入区域优化 */
:global(.chat-fullscreen-mode) .border-t.border-gray-200.p-4 {
  padding: 1.5rem 3rem !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  height: 60px !important; /* 固定高度 */
  flex-shrink: 0 !important;
}

/* 全屏模式下暗色主题支持 */
:global(.dark.chat-fullscreen-mode) .flex.items-center.justify-between.p-4 {
  background: rgba(31, 41, 55, 0.95) !important;
  border-bottom: 1px solid rgba(55, 65, 81, 0.5) !important;
}

:global(.dark.chat-fullscreen-mode) .border-t.border-gray-200.p-4 {
  background: rgba(31, 41, 55, 0.95) !important;
  border-top: 1px solid rgba(55, 65, 81, 0.5) !important;
}
/* 深色模式下的全屏样式 */
:global(.dark.chat-fullscreen-mode) .min-h-screen.flex.items-center.justify-center.p-4 {
  background: #111827 !important;
}

:global(.dark.chat-fullscreen-mode) .flex.items-center.justify-between.p-4 {
  background: rgba(31, 41, 55, 0.95) !important;
  border-bottom: 1px solid rgba(75, 85, 99, 0.5) !important;
}

:global(.dark.chat-fullscreen-mode) .border-t.border-gray-200.p-4 {
  background: rgba(17, 24, 39, 0.95) !important;
  border-top: 1px solid rgba(55, 65, 81, 0.5) !important;
}

/* 全屏模式下的消息样式优化 */
:global(.chat-fullscreen-mode) .max-w-3xl {
  max-width: 80rem !important;
}

:global(.chat-fullscreen-mode) .max-w-2xl {
  max-width: 60rem !important;
}

/* 移动端优化 - 使聊天区域充满屏幕 */
@media (max-width: 1023px) {
  /* 移动端消息区域最大化 */
  .flex-1.overflow-y-auto.p-6 {
    flex: 1 !important;
    height: calc(100vh - 56px - 180px) !important; /* 减去顶部栏和输入区域高度 */
    max-height: calc(100vh - 56px - 180px) !important;
    padding: 1rem !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 1rem !important;
    overflow-y: auto !important;
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
    max-height: 180px !important; /* 限制输入区域最大高度 */
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
    height: calc(100vh - 48px - 140px) !important; /* 横屏顶部栏更矮 */
    max-height: calc(100vh - 48px - 140px) !important;
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
