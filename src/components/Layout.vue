<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 移动端遮罩层 -->
    <div
      v-if="isMobile && sidebarOpen"
      @click="toggleSidebar"
      class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
    ></div>

    <!-- 侧边栏 -->
    <div
      :class="[
        'fixed z-50 h-full transition-transform duration-300 ease-in-out lg:relative',
        isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0',
      ]"
    >
      <Sidebar :collapsed="false" />
    </div>

    <!-- 主内容区域 -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- 移动端顶部栏 -->
      <div class="flex items-center border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button @click="toggleSidebar" class="rounded-lg p-2 transition-colors hover:bg-gray-100">
          <Menu class="h-5 w-5 text-gray-600" />
        </button>
        <h1 class="ml-4 text-lg font-semibold text-gray-800">NextChat</h1>
      </div>

      <ChatArea />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { Menu } from 'lucide-vue-next'
  import Sidebar from '@/components/Sidebar.vue'
  import ChatArea from '@/components/ChatArea.vue'

  const isMobile = ref(false)
  const sidebarOpen = ref(false)

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 1024
    if (!isMobile.value) {
      sidebarOpen.value = false
    }
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
</script>
