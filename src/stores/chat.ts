import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export interface Message {
  id: string
  content: string
  type: 'text' | 'code'
  timestamp: string
  sender: 'user' | 'assistant' | 'system'
  model?: string // 添加模型信息
}

export interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  messages: Message[]
}

export const useChatStore = defineStore('chat', () => {
  const settingsStore = useSettingsStore()

  // 从localStorage加载数据
  const loadConversations = (): Conversation[] => {
    const saved = localStorage.getItem('nextchat-conversations')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (error) {
        console.error('Failed to load conversations:', error)
      }
    }
    // 默认对话
    return [
      {
        id: '1',
        title: '新的聊天',
        lastMessage: '开始新的对话',
        timestamp: new Date().toLocaleString('zh-CN'),
        messages: [],
      },
    ]
  }

  const conversations = ref<Conversation[]>(loadConversations())
  const currentConversationId = ref<string>(
    localStorage.getItem('nextchat-current-conversation') || '1'
  )

  // 生成对话标题
  const generateConversationTitle = (conversation: Conversation): string => {
    if (!settingsStore.settings.autoGenerateTitle) {
      return conversation.title
    }

    const userMessages = conversation.messages.filter((msg) => msg.sender === 'user')
    if (userMessages.length === 0) {
      return conversation.title
    }

    // 使用第一条用户消息生成标题
    const firstMessage = userMessages[0].content
    const title = extractTitleFromMessage(firstMessage)
    return title || conversation.title
  }

  // 从消息内容提取标题
  const extractTitleFromMessage = (content: string): string => {
    // 移除特殊字符和表情符号
    const cleanContent = content.replace(
      /[^\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ffa-zA-Z0-9\s]/g,
      ''
    )

    // 取前20个字符作为标题
    const title = cleanContent.slice(0, 20).trim()

    // 如果内容太短，返回默认标题
    if (title.length < 3) {
      return ''
    }

    // 如果标题太长，添加省略号
    if (cleanContent.length > 20) {
      return title + '...'
    }

    return title
  }

  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === currentConversationId.value)
  )

  const setCurrentConversation = (id: string) => {
    currentConversationId.value = id
    localStorage.setItem('nextchat-current-conversation', id)
  }

  const addMessage = (conversationId: string, message: Message) => {
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (conversation) {
      conversation.messages.push(message)
      conversation.lastMessage =
        message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
      conversation.timestamp = new Date().toLocaleString('zh-CN')

      // 自动生成标题（仅在第一条用户消息时）
      if (
        message.sender === 'user' &&
        conversation.messages.filter((m) => m.sender === 'user').length === 1
      ) {
        const newTitle = generateConversationTitle(conversation)
        if (newTitle && newTitle !== conversation.title) {
          conversation.title = newTitle
        }
      }

      // 保存到localStorage
      localStorage.setItem('nextchat-conversations', JSON.stringify(conversations.value))
    }
  }

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: '新的聊天',
      lastMessage: '',
      timestamp: new Date().toLocaleString('zh-CN'),
      messages: [],
    }
    conversations.value.unshift(newConversation)
    currentConversationId.value = newConversation.id
    // 保存到localStorage
    localStorage.setItem('nextchat-conversations', JSON.stringify(conversations.value))
    localStorage.setItem('nextchat-current-conversation', newConversation.id)
    return newConversation.id
  }

  const createMaskedConversation = (
    maskName: string,
    maskDescription: string,
    maskPrompt: string
  ) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: maskName,
      lastMessage: '',
      timestamp: new Date().toLocaleString('zh-CN'),
      messages: [],
    }
    conversations.value.unshift(newConversation)
    currentConversationId.value = newConversation.id

    // 添加系统消息作为面具提示
    const systemMessage: Message = {
      id: Date.now().toString(),
      content: maskPrompt,
      type: 'text',
      timestamp: new Date().toLocaleString(),
      sender: 'system',
    }

    // 添加欢迎消息
    const welcomeMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: `你好！我是${maskName}，${maskDescription}。有什么可以帮助你的吗？`,
      type: 'text',
      timestamp: new Date().toLocaleString(),
      sender: 'assistant',
    }

    addMessage(newConversation.id, systemMessage)
    addMessage(newConversation.id, welcomeMessage)

    // 保存到localStorage
    localStorage.setItem('nextchat-conversations', JSON.stringify(conversations.value))
    localStorage.setItem('nextchat-current-conversation', newConversation.id)

    return newConversation.id
  }

  const deleteConversation = (id: string) => {
    const index = conversations.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      conversations.value.splice(index, 1)

      // 如果删除的是当前对话，切换到第一个对话或创建新对话
      if (currentConversationId.value === id) {
        if (conversations.value.length > 0) {
          currentConversationId.value = conversations.value[0].id
        } else {
          // 如果没有对话了，创建一个新对话
          createNewConversation()
        }
      }

      // 保存到localStorage
      localStorage.setItem('nextchat-conversations', JSON.stringify(conversations.value))
      localStorage.setItem('nextchat-current-conversation', currentConversationId.value)
    }
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    setCurrentConversation,
    addMessage,
    createNewConversation,
    createMaskedConversation,
    deleteConversation,
  }
})
