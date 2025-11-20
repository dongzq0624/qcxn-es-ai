<template>
  <div class="flex flex-1 flex-col bg-white dark:bg-gray-900">
    <!-- 顶部导航栏 -->
    <div class="flex items-center border-b border-gray-200 p-4 dark:border-gray-700">
      <button
        @click="goBack"
        class="flex items-center gap-1 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ChevronLeft class="h-5 w-5" />
        <span class="text-sm">返回</span>
      </button>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 overflow-y-auto">
      <!-- Hero区域 -->
      <div class="px-4 py-8 text-center">
        <!-- 推荐面具预览卡片 -->
        <div class="mb-6 flex justify-center gap-4">
          <div
            v-for="mask in recommendedMasks.slice(0, 3)"
            :key="mask.id"
            @click="selectMask(mask)"
            class="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl bg-white text-2xl shadow-md transition-transform hover:scale-105 dark:bg-gray-800"
          >
            {{ mask.emoji }}
          </div>
        </div>

        <!-- 标题和副标题 -->
        <h1 class="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">挑选一个面具</h1>
        <p class="mb-6 text-gray-600 dark:text-gray-400">现在开始，与面具背后的灵魂思维碰撞</p>

        <!-- 操作按钮 -->
        <div class="mb-8 flex justify-center gap-4">
          <button
            @click="viewAll"
            class="flex items-center gap-2 rounded-full border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Eye class="h-4 w-4" />
            查看全部
          </button>
          <button
            @click="startDirectly"
            class="flex items-center gap-2 rounded-full bg-teal-500 px-6 py-2 text-white transition-colors hover:bg-teal-600"
          >
            <Zap class="h-4 w-4" />
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
            class="group flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <span class="text-sm">{{ mask.emoji }}</span>
            <span
              class="text-sm text-gray-700 group-hover:text-teal-600 dark:text-gray-300 dark:group-hover:text-teal-400"
            >
              {{ mask.name }}
            </span>
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
