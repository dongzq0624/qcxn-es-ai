import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useMasks } from '@/hooks/useMasks'

export function useNavigation() {
  const router = useRouter()
  const chatStore = useChatStore()
  const { incrementConversationCount } = useMasks()

  const navigateToHome = (conversationId?: string) => {
    if (conversationId) {
      router.push({ name: 'Chat', params: { uuid: conversationId } })
    } else {
      router.push('/')
    }
  }

  const navigateToSettings = () => {
    router.push({ name: 'settings' })
  }

  const navigateToMasks = () => {
    router.push({ name: 'masks' })
  }

  const startNewChat = () => {
    // 创建新的对话并重定向到主页，同时传递新对话的ID
    const newConversationId = chatStore.createNewConversation()
    navigateToHome(newConversationId)
    return newConversationId
  }

  const startMaskedChat = (maskId: string) => {
    const { getMaskById } = useMasks()
    const mask = getMaskById(maskId)

    if (mask) {
      // 创建带面具的对话
      const newConversationId = chatStore.createMaskedConversation(
        mask.name,
        mask.description,
        mask.prompt
      )
      incrementConversationCount(maskId)
      navigateToHome(newConversationId)
    }
  }

  const selectConversation = (conversationId: string) => {
    chatStore.setCurrentConversation(conversationId)
    navigateToHome(conversationId)
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
