<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-gray-900">
    <!-- 顶部导航栏 -->
    <div class="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
      <button 
        @click="goBack"
        class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronLeft class="w-5 h-5" />
        <span class="text-sm">返回</span>
      </button>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 overflow-y-auto">
      <!-- Hero区域 -->
      <div class="text-center py-8 px-4">
        <!-- 推荐面具预览卡片 -->
        <div class="flex justify-center gap-4 mb-6">
          <div 
            v-for="mask in recommendedMasks.slice(0, 3)" 
            :key="mask.id"
            @click="selectMask(mask)"
            class="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-md flex items-center justify-center text-2xl cursor-pointer hover:scale-105 transition-transform"
          >
            {{ mask.emoji }}
          </div>
        </div>
        
        <!-- 标题和副标题 -->
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">挑选一个面具</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">现在开始，与面具背后的灵魂思维碰撞</p>
        
        <!-- 操作按钮 -->
        <div class="flex justify-center gap-4 mb-8">
          <button 
            @click="viewAll"
            class="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Eye class="w-4 h-4" />
            查看全部
          </button>
          <button 
            @click="startDirectly"
            class="px-6 py-2 rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-colors flex items-center gap-2"
          >
            <Zap class="w-4 h-4" />
            直接开始
          </button>
        </div>
      </div>

      <!-- 面具网格 -->
      <div class="px-4 pb-8">
        <div class="flex flex-wrap gap-3">
          <div 
            v-for="mask in masks" 
            :key="mask.id"
            @click="selectMask(mask)"
            class="px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer flex items-center gap-2 group"
          >
            <span class="text-sm">{{ mask.emoji }}</span>
            <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-teal-600 dark:group-hover:text-teal-400">{{ mask.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, Eye, Zap } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useMasks, useNavigation } from '@/hooks'
import type { Mask } from '@/hooks'

const router = useRouter()
const chatStore = useChatStore()
const { recommendedMasks, masks } = useMasks()
const { startMaskedChat, startNewChat } = useNavigation()

const goBack = () => {
  router.push('/')
}

const viewAll = () => {
  router.push('/masks-management')
}

const startDirectly = () => {
  startNewChat()
}

const selectMask = (mask: Mask) => {
  startMaskedChat(mask.id)
}
</script>