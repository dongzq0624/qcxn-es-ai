import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useMasks } from '@/hooks/useMasks'

export function useNavigation() {
  const router = useRouter()
  const chatStore = useChatStore()
  const { incrementConversationCount } = useMasks()

  const navigateToHome = () => {
    router.push('/')
  }

  const navigateToSettings = () => {
    router.push('/settings')
  }

  const navigateToMasks = () => {
    router.push('/masks')
  }

  const startNewChat = () => {
    // 创建新的对话并重定向到主页
    const newConversationId = chatStore.createNewConversation()
    navigateToHome()
    return newConversationId
  }

  const startMaskedChat = (maskId: string) => {
    const { getMaskById } = useMasks()
    const mask = getMaskById(maskId)

    if (mask) {
      // 创建带面具的对话
      chatStore.createMaskedConversation(mask.name, mask.description, mask.prompt)
      incrementConversationCount(maskId)
      navigateToHome()
    }
  }

  const selectConversation = (conversationId: string) => {
    chatStore.setCurrentConversation(conversationId)
    navigateToHome()
  }

  return {
    navigateToHome,
    navigateToSettings,
    navigateToMasks,
    startNewChat,
    startMaskedChat,
    selectConversation,
  }
}
