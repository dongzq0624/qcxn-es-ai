<template>
  <div
    :class="[
      'flex h-full flex-col border-r border-gray-200 bg-gradient-to-b from-blue-100 via-cyan-50 to-teal-50 shadow-inner transition-all duration-300',
      'h-full w-full',
      collapsed ? 'w-16' : isMobile ? 'w-full' : 'w-80',
    ]"
  >
    <!-- 收缩状态的头像和展开按钮 -->
    <div
      v-if="collapsed && !isMobile"
      class="flex flex-col items-center space-y-4 bg-gradient-to-b from-blue-100 to-cyan-50 p-4"
    >
      <div class="text-2xl">🤖</div>
      <button
        @click="$emit('toggle-collapse')"
        class="rounded-full p-2 transition-colors hover:bg-white/50"
      >
        <PanelRightOpen class="h-5 w-5 text-gray-600" />
      </button>
    </div>

    <!-- 展开状态的完整侧边栏 -->
    <template v-else>
      <!-- 头部区域 -->
      <div class="border-b border-white/30 bg-white/20 p-6 backdrop-blur-sm">
        <div class="mb-2 flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-800">NextChat</h1>
          <button
            v-if="!isMobile"
            @click="$emit('toggle-collapse')"
            class="rounded-full p-1 transition-colors hover:bg-white/50"
          >
            <PanelLeftClose class="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <p class="mb-6 text-sm text-gray-600">Build your own AI assistant.</p>

        <!-- 导航按钮 - 仅保留面具 -->
        <div class="flex gap-2">
          <button
            @click="handleNavigateToMasks"
            :class="[
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'masks'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-white/50',
            ]"
          >
            <Theater class="h-4 w-4" />
            面具
          </button>
        </div>
      </div>

      <!-- 会话列表 -->
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-3 p-4">
          <div
            v-for="conversation in conversations"
            :key="conversation.id"
            @click="handleConversationSelect(conversation.id)"
            :class="[
              'group relative cursor-pointer rounded-xl p-4 transition-all',
              currentConversationId === conversation.id
                ? 'border-2 border-teal-300 bg-white/80 shadow-lg backdrop-blur-sm'
                : 'border border-white/20 bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:shadow-md',
            ]"
          >
            <!-- 右上角删除按钮 -->
            <button
              @click.stop="chatStore.deleteConversation(conversation.id)"
              class="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 opacity-0 shadow-sm transition-all hover:bg-red-100 group-hover:opacity-100"
              title="删除对话"
            >
              <X class="h-3 w-3 text-gray-400 hover:text-red-500" />
            </button>

            <div class="pr-8">
              <!-- 为删除按钮留出空间 -->
              <h3 class="mb-2 font-medium text-gray-800">{{ conversation.title }}</h3>
              <p class="mb-2 text-sm text-gray-600">{{ conversation.messages.length }} 条对话</p>
              <p class="text-xs text-gray-400">{{ conversation.timestamp }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 - 仅保留设置和新的聊天 -->
      <div class="border-t border-white/30 bg-white/40 p-4 backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <button
            @click="openSettings"
            class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
          >
            <Settings class="h-5 w-5 text-gray-600" />
          </button>
          <button
            @click="handleNavigateToMasks"
            class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Plus class="h-4 w-4" />
            新的聊天
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import {
    Settings,
    HelpCircle,
    Info,
    PanelLeftClose,
    PanelRightOpen,
    Plus,
    X,
  } from 'lucide-vue-next'
  import { useChatStore } from '@/stores/chat'
  import { useRouter } from 'vue-router'
  import { useNavigation } from '@/hooks/useNavigation'

  interface Props {
    collapsed: boolean
    isMobile?: boolean
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    'toggle-collapse': []
    'open-settings': []
    'conversation-selected': []
  }>()

  const router = useRouter()
  const chatStore = useChatStore()
  const { navigateToMasks, startNewChat, selectConversation } = useNavigation()
  const activeTab = ref('chat')

  const conversations = computed(() => chatStore.conversations)
  const currentConversationId = computed(() => chatStore.currentConversationId)

  const openSettings = () => {
    emit('open-settings')
  }

  const handleConversationSelect = (conversationId: string) => {
    selectConversation(conversationId)
    emit('conversation-selected')
  }

  const handleNavigateToMasks = () => {
    navigateToMasks()
    emit('conversation-selected')
  }
</script>

<style scoped>
  /* 移动端全屏优化 */
  @media (max-width: 1023px) {
    .h-full {
      height: 100vh !important;
      width: 100vw !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      z-index: 50 !important;
    }

    /* 确保会话列表区域可以滚动 */
    .flex-1.overflow-y-auto {
      flex: 1 1 auto !important;
      min-height: 0 !important;
      max-height: calc(100vh - 200px) !important; /* 减去头部和底部的高度 */
    }

    /* 确保底部按钮固定在底部 */
    .p-4.border-t.border-white\/30 {
      position: sticky !important;
      bottom: 0 !important;
      background: rgba(255, 255, 255, 0.4) !important;
      backdrop-filter: blur(8px) !important;
    }
  }
</style>
