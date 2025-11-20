<template>
  <div :class="[
    'h-full bg-gradient-to-b from-blue-100 via-cyan-50 to-teal-50 border-r border-gray-200 flex flex-col transition-all duration-300 shadow-inner',
    'w-full h-full',
    collapsed ? 'w-16' : isMobile ? 'w-full' : 'w-80'
  ]">
    <!-- 收缩状态的头像和展开按钮 -->
    <div v-if="collapsed && !isMobile" class="p-4 flex flex-col items-center space-y-4 bg-gradient-to-b from-blue-100 to-cyan-50">
      <div class="text-2xl">🤖</div>
      <button 
        @click="$emit('toggle-collapse')"
        class="p-2 rounded-full hover:bg-white/50 transition-colors"
      >
        <PanelRightOpen class="w-5 h-5 text-gray-600" />
      </button>
    </div>

    <!-- 展开状态的完整侧边栏 -->
    <template v-else>
      <!-- 头部区域 -->
      <div class="p-6 border-b border-white/30 bg-white/20 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-2">
          <h1 class="text-2xl font-bold text-gray-800">NextChat</h1>
          <button 
            v-if="!isMobile"
            @click="$emit('toggle-collapse')"
            class="p-1 rounded-full hover:bg-white/50 transition-colors"
          >
            <PanelLeftClose class="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <p class="text-sm text-gray-600 mb-6">Build your own AI assistant.</p>
        
        <!-- 导航按钮 - 仅保留面具 -->
        <div class="flex gap-2">
          <button 
            @click="handleNavigateToMasks" 
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'masks' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-white/50'
            ]"
          >
            <Theater class="w-4 h-4" />
            面具
          </button>
        </div>
      </div>

      <!-- 会话列表 -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-4 space-y-3">
          <div 
            v-for="conversation in conversations" 
            :key="conversation.id"
            @click="handleConversationSelect(conversation.id)"
            :class="[
              'p-4 rounded-xl cursor-pointer transition-all relative group',
              currentConversationId === conversation.id 
                ? 'bg-white/80 border-2 border-teal-300 shadow-lg backdrop-blur-sm' 
                : 'bg-white/60 hover:bg-white/80 hover:shadow-md border border-white/20 backdrop-blur-sm'
            ]"
          >
            <!-- 右上角删除按钮 -->
            <button 
              @click.stop="chatStore.deleteConversation(conversation.id)"
              class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-all z-10 shadow-sm"
              title="删除对话"
            >
              <X class="w-3 h-3 text-gray-400 hover:text-red-500" />
            </button>
            
            <div class="pr-8"> <!-- 为删除按钮留出空间 -->
              <h3 class="font-medium text-gray-800 mb-2">{{ conversation.title }}</h3>
              <p class="text-sm text-gray-600 mb-2">{{ conversation.messages.length }} 条对话</p>
              <p class="text-xs text-gray-400">{{ conversation.timestamp }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 - 仅保留设置和新的聊天 -->
      <div class="p-4 border-t border-white/30 bg-white/40 backdrop-blur-sm">
        <div class="flex justify-between items-center">
          <button 
            @click="openSettings"
            class="w-10 h-10 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm border border-gray-200"
          >
            <Settings class="w-5 h-5 text-gray-600" />
          </button>
          <button 
            @click="handleNavigateToMasks"
            class="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm border border-gray-200 text-sm text-gray-700 font-medium"
          >
            <Plus class="w-4 h-4" />
            新的聊天
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Settings, HelpCircle, Info, PanelLeftClose, PanelRightOpen, Plus, X } from 'lucide-vue-next'
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