import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { v4 as uuidv4 } from 'uuid'

export interface Message {
  id: string
  content: string
  type: 'text' | 'code'
  timestamp: string
  sender: 'user' | 'assistant' | 'system'
  model?: string // 添加模型信息
}

// 对话元数据接口（用于分层存储）
export interface ConversationMetadata {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  messageCount: number
}

export interface Conversation extends ConversationMetadata {
  messages: Message[]
  isLoaded: boolean // 标记消息是否已完全加载
}

export const useChatStore = defineStore('chat', () => {
  const settingsStore = useSettingsStore()

  // 从localStorage加载对话元数据（分层存储的第一层）
  const loadConversations = (): Conversation[] => {
    try {
      // 尝试从新的分层存储中加载
      const metadataKey = 'nextchat-conversations-metadata'
      const savedMetadata = localStorage.getItem(metadataKey)

      if (savedMetadata) {
        const metadataList: ConversationMetadata[] = JSON.parse(savedMetadata)
        // 将元数据转换为对话对象，但不加载消息
        return metadataList.map((meta) => ({
          ...meta,
          messages: [], // 初始时不加载消息
          isLoaded: false,
        }))
      }

      // 兼容旧版存储格式
      const oldKey = 'nextchat-conversations'
      const saved = localStorage.getItem(oldKey)
      if (saved) {
        const allConversations = JSON.parse(saved)
        // 转换为新的分层存储格式并保存
        const metadataList = allConversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          lastMessage: conv.lastMessage,
          timestamp: conv.timestamp,
          messageCount: conv.messages?.length || 0,
        }))

        // 保存元数据到新的存储键
        localStorage.setItem(metadataKey, JSON.stringify(metadataList))

        // 单独保存每个对话的消息
        allConversations.forEach((conv: any) => {
          const messagesKey = `nextchat-conversation-${conv.id}-messages`
          localStorage.setItem(messagesKey, JSON.stringify(conv.messages || []))
        })

        // 返回转换后的对话对象列表，只包含元数据
        return metadataList.map((meta) => ({
          ...meta,
          messages: [],
          isLoaded: false,
        }))
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }

    // 默认对话
    const defaultConversation: Conversation = {
      id: uuidv4(),
      title: '新的聊天',
      lastMessage: '开始新的对话',
      timestamp: new Date().toLocaleString('zh-CN'),
      messageCount: 0,
      messages: [],
      isLoaded: true, // 默认对话直接加载消息
    }

    // 保存默认对话的元数据和消息
    const metadataKey = 'nextchat-conversations-metadata'
    localStorage.setItem(metadataKey, JSON.stringify([defaultConversation]))
    const messagesKey = `nextchat-conversation-${defaultConversation.id}-messages`
    localStorage.setItem(messagesKey, JSON.stringify(defaultConversation.messages))

    return [defaultConversation]
  }

  // 加载特定对话的消息（分层存储的第二层）
  const loadConversationMessages = (conversationId: string): Message[] => {
    try {
      const messagesKey = `nextchat-conversation-${conversationId}-messages`
      const saved = localStorage.getItem(messagesKey)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error(`Failed to load messages for conversation ${conversationId}:`, error)
      return []
    }
  }

  // 保存对话元数据列表
  const saveConversationsMetadata = () => {
    const metadataKey = 'nextchat-conversations-metadata'
    const metadataList = conversations.value.map((conv) => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.lastMessage,
      timestamp: conv.timestamp,
      messageCount: conv.messages.length,
    }))
    localStorage.setItem(metadataKey, JSON.stringify(metadataList))
  }

  // 保存特定对话的消息
  const saveConversationMessages = (conversationId: string, messages: Message[]) => {
    const messagesKey = `nextchat-conversation-${conversationId}-messages`
    localStorage.setItem(messagesKey, JSON.stringify(messages))
  }

  // 只调用一次loadConversations()
  const loadedConversations = loadConversations()
  const conversations = ref<Conversation[]>(loadedConversations)

  // 初始化当前对话ID，使用localStorage中保存的值或第一个对话的ID
  const savedId = localStorage.getItem('nextchat-current-conversation')
  const firstConversationId = loadedConversations[0]?.id || uuidv4()
  const currentConversationId = ref<string>(savedId || firstConversationId)

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

  // 惰性加载对话消息的方法
  const lazyLoadConversation = (conversationId: string) => {
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (conversation && !conversation.isLoaded) {
      conversation.messages = loadConversationMessages(conversationId)
      conversation.isLoaded = true
    }
    return conversation
  }

  // 当访问当前对话时，确保消息已加载（惰性加载）
  const currentConversation = computed(() => {
    const conversation = conversations.value.find((c) => c.id === currentConversationId.value)
    if (conversation && !conversation.isLoaded) {
      lazyLoadConversation(currentConversationId.value)
    }
    return conversation
  })

  const setCurrentConversation = (id: string) => {
    currentConversationId.value = id
    localStorage.setItem('nextchat-current-conversation', id)
  }

  const addMessage = (conversationId: string, message: Message) => {
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (conversation) {
      // 确保消息已加载
      if (!conversation.isLoaded) {
        lazyLoadConversation(conversation.id)
      }

      conversation.messages.push(message)
      conversation.lastMessage =
        message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
      conversation.timestamp = new Date().toLocaleString('zh-CN')
      conversation.messageCount = conversation.messages.length

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

      // 保存到localStorage - 使用分层存储
      saveConversationMessages(conversation.id, conversation.messages)
      saveConversationsMetadata()
    }
  }

  const createNewConversation = () => {
    const id = uuidv4()
    const newConversation: Conversation = {
      id,
      title: '新的聊天',
      lastMessage: '',
      timestamp: new Date().toLocaleString('zh-CN'),
      messageCount: 0,
      messages: [],
      isLoaded: true,
    }
    conversations.value.unshift(newConversation)
    currentConversationId.value = newConversation.id
    // 保存到localStorage - 使用分层存储
    saveConversationsMetadata()
    saveConversationMessages(id, [])
    localStorage.setItem('nextchat-current-conversation', newConversation.id)
    return newConversation.id
  }

  const createMaskedConversation = (
    maskName: string,
    maskDescription: string,
    maskPrompt: string
  ) => {
    const id = uuidv4()
    const newConversation: Conversation = {
      id,
      title: maskName,
      lastMessage: '',
      timestamp: new Date().toLocaleString('zh-CN'),
      messageCount: 0,
      messages: [],
      isLoaded: true,
    }
    conversations.value.unshift(newConversation)
    currentConversationId.value = newConversation.id

    // 添加欢迎消息
    const welcomeMessage: Message = {
      id: uuidv4(),
      content: `您好！很高兴为您服务。${maskPrompt}`,
      type: 'text',
      timestamp: new Date().toLocaleString(),
      sender: 'assistant',
    }

    addMessage(newConversation.id, welcomeMessage)

    // 保存到localStorage - 使用分层存储
    saveConversationsMetadata()
    saveConversationMessages(id, [])
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

      // 保存到localStorage - 使用分层存储
      saveConversationsMetadata()
      // 删除对应的消息数据
      localStorage.removeItem(`nextchat-conversation-${id}-messages`)
      localStorage.setItem('nextchat-current-conversation', currentConversationId.value)
    }
  }

  const renameConversation = (id: string, title: string) => {
    const conversation = conversations.value.find((c) => c.id === id)
    if (conversation) {
      conversation.title = title
      // 保存元数据到localStorage
      saveConversationsMetadata()
    }
  }

  const updateMessage = (id: string, message: Message) => {
    const conversation = currentConversation.value
    if (!conversation) return

    // 确保消息已加载
    if (!conversation.isLoaded) {
      lazyLoadConversation(conversation.id)
    }

    const messageIndex = conversation.messages.findIndex((m) => m.id === id)
    if (messageIndex !== -1) {
      conversation.messages[messageIndex] = message
      // 更新元数据中的最后一条消息
      if (messageIndex === conversation.messages.length - 1) {
        conversation.lastMessage =
          message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
        conversation.timestamp = new Date().toLocaleString('zh-CN')
      }
      // 保存消息和元数据
      saveConversationMessages(conversation.id, conversation.messages)
      saveConversationsMetadata()
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
    lazyLoadConversation,
    renameConversation,
    updateMessage,
  }
})
