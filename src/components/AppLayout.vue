<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900 lg:p-4"
  >
    <!-- 卡片容器 -->
    <div
      :class="[
        'flex w-full max-w-6xl overflow-hidden bg-white shadow-2xl dark:bg-gray-800',
        'lg:h-[90vh] lg:rounded-2xl',
        'h-screen max-h-screen rounded-none lg:max-h-none',
      ]"
    >
      <!-- 移动端遮罩层 -->
      <div
        v-if="isMobile && sidebarOpen"
        @click="toggleSidebar"
        class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
      ></div>

      <!-- 侧边栏 -->
      <div
        :class="[
          'fixed z-50 transition-all duration-300 ease-in-out lg:relative',
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0',
          isMobile
            ? 'left-0 top-0 h-screen w-full'
            : sidebarCollapsed
              ? 'h-full w-16'
              : 'h-full w-80',
        ]"
      >
        <Sidebar
          @open-settings="goToSettings"
          @toggle-collapse="toggleSidebarCollapse"
          @conversation-selected="handleConversationSelected"
          :collapsed="isMobile ? false : sidebarCollapsed"
          :is-mobile="isMobile"
        />
      </div>

      <!-- 主内容区域 -->
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <!-- 移动端顶部栏 -->
        <div
          v-if="isMobile && $route.name !== 'settings'"
          class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800 lg:hidden"
        >
          <div class="flex items-center">
            <button
              @click="toggleSidebar"
              class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu class="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 class="ml-4 text-lg font-semibold text-gray-800 dark:text-gray-200">NextChat</h1>
          </div>
          <!-- 移动端不需要侧边栏收缩按钮 -->
        </div>

        <!-- 桌面端侧边栏收缩按钮 -->
        <div
          v-if="!isMobile"
          :class="[
            'fixed top-1/2 z-30 -translate-y-1/2 transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'left-12' : 'left-72',
          ]"
        >
          <button
            @click="toggleSidebarCollapse"
            class="rounded-full border border-gray-200 bg-white p-2 shadow-lg transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <ChevronLeft
              v-if="!sidebarCollapsed"
              class="h-4 w-4 text-gray-600 dark:text-gray-400"
            />
            <ChevronRight v-else class="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <!-- 路由视图 -->
        <router-view class="flex-1 overflow-hidden" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* 移动端优化 */
  @media (max-width: 1023px) {
    /* 移除外层容器的边距和圆角 */
    .min-h-screen {
      padding: 0 !important;
    }

    /* 确保主容器填满屏幕 */
    .max-w-6xl {
      max-width: none !important;
      width: 100vw !important;
      height: 100vh !important;
      border-radius: 0 !important;
      margin: 0 !important;
    }

    /* 确保聊天区域填满可用空间 */
    .flex-1.flex.flex-col {
      height: 100vh !important;
      max-height: 100vh !important;
    }

    /* 移动端顶部栏优化 */
    .lg\:hidden {
      flex-shrink: 0 !important;
      height: 56px !important; /* 固定移动端顶部栏高度 */
    }

    /* 确保消息区域可以滚动 */
    .overflow-hidden {
      overflow: hidden !important;
    }

    /* 输入区域固定到底部 */
    .border-t {
      flex-shrink: 0 !important;
    }

    /* 优化路由视图容器 */
    .flex-1.overflow-hidden {
      height: calc(100vh - 56px) !important; /* 减去移动端顶部栏高度 */
      max-height: calc(100vh - 56px) !important;
    }

    /* 确保聊天内容区域可以滚动 */
    .flex-1.overflow-y-auto {
      flex: 1 !important;
      min-height: 0 !important; /* 重要：允许flex子项收缩 */
    }

    /* 移动端侧边栏全屏覆盖 */
    .fixed.lg\:relative.z-50.h-full {
      width: 100vw !important; /* 全屏宽度 */
      height: 100vh !important; /* 全屏高度 */
      top: 0 !important;
      left: 0 !important;
      z-index: 50 !important; /* 确保在最上层 */
    }

    /* 移动端遮罩层优化 */
    .fixed.inset-0.bg-black.bg-opacity-50.z-40 {
      z-index: 40 !important; /* 确保在侧边栏下方 */
    }

    /* 确保侧边栏容器在移动端正确覆盖 */
    .fixed.z-50 {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 50 !important;
    }
  }

  /* 针对更小的手机屏幕优化 */
  @media (max-width: 640px) {
    /* 进一步优化输入区域 */
    .border-t {
      padding: 0.75rem !important;
    }

    /* 优化消息间距 */
    .space-y-4 > * + * {
      margin-top: 0.75rem !important;
    }

    /* 优化代码块显示 */
    pre {
      font-size: 0.75rem !important;
      padding: 0.5rem !important;
    }
  }

  /* 横屏模式优化 */
  @media (max-width: 1023px) and (orientation: landscape) {
    /* 横屏时减少顶部栏高度 */
    .lg\:hidden {
      height: 48px !important;
    }

    /* 调整路由视图高度 */
    .flex-1.overflow-hidden {
      height: calc(100vh - 48px) !important;
      max-height: calc(100vh - 48px) !important;
    }
  }
</style>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { Menu, ChevronLeft, ChevronRight } from 'lucide-vue-next'
  import Sidebar from '@/components/Sidebar.vue'

  const router = useRouter()
  const isMobile = ref(false)
  const sidebarOpen = ref(false)
  const sidebarCollapsed = ref(false)

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 1024
    if (!isMobile.value) {
      sidebarOpen.value = false
    }
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const toggleSidebarCollapse = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const goToSettings = () => {
    router.push('/settings')
    if (isMobile.value) {
      sidebarOpen.value = false
    }
  }

  const handleConversationSelected = () => {
    if (isMobile.value) {
      sidebarOpen.value = false
    }
  }

  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
</script>
