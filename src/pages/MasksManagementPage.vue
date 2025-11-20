<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-gray-800">
    <!-- 顶部导航栏 -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
      <div class="flex items-center gap-3">
        <button 
          @click="goBack"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">面具管理</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">管理和创建你的AI角色面具</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="showRecommended = !showRecommended"
          :class="[
            'px-4 py-2 rounded-full border transition-colors flex items-center gap-2',
            showRecommended 
              ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400' 
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
        >
          <Star class="w-4 h-4" />
          推荐
        </button>
        <button 
          @click="startDirectly"
          class="px-4 py-2 rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-colors flex items-center gap-2"
        >
          <Zap class="w-4 h-4" />
          直接开始
        </button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- 搜索框 -->
        <div class="flex-1 relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索角色面具"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        
        <!-- 筛选下拉框 -->
        <div class="flex gap-2">
          <select
            v-model="selectedLanguage"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option v-for="lang in languages" :key="lang" :value="lang">
              {{ lang }}
            </option>
          </select>
          
          <select
            v-model="selectedCategory"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>
        
        <!-- 新建按钮 -->
        <button 
          @click="showCreateDialog = true"
          class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          新建
        </button>
      </div>
    </div>

    <!-- 推荐面具预览 -->
    <div v-if="showRecommended" class="p-6 border-b border-gray-200 dark:border-gray-600">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">推荐面具</h3>
      <div class="flex gap-4 overflow-x-auto pb-2">
        <div 
          v-for="mask in recommendedMasks" 
          :key="mask.id"
          @click="selectMask(mask)"
          class="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl cursor-pointer hover:scale-105 transition-transform shadow-lg"
        >
          {{ mask.emoji }}
        </div>
      </div>
    </div>

    <!-- 面具网格 -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="mask in filteredMasks" 
          :key="mask.id"
          class="p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all group"
        >
          <!-- 面具头部 -->
          <div class="flex items-center gap-4 mb-4">
            <div class="text-3xl">{{ mask.emoji }}</div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">{{ mask.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ mask.description }}</p>
            </div>
          </div>
          
          <!-- 面具信息 -->
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">语言:</span>
              <span class="text-gray-700 dark:text-gray-300">{{ mask.language }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">模型:</span>
              <span class="text-gray-700 dark:text-gray-300">{{ mask.model }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">对话数:</span>
              <span class="text-gray-700 dark:text-gray-300">{{ mask.conversationCount }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">分类:</span>
              <span class="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs">{{ mask.category }}</span>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="grid grid-cols-2 gap-2">
            <button 
              @click="selectMask(mask)"
              class="px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
            >
              对话
            </button>
            <button 
              @click="editMask(mask)"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              编辑
            </button>
            <button 
              @click="deleteMask(mask)"
              class="px-3 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
            >
              删除
            </button>
            <button 
              @click="viewMask(mask)"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              查看
            </button>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredMasks.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">🎭</div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">没有找到面具</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">尝试调整搜索条件或创建新的面具</p>
        <button 
          @click="showCreateDialog = true"
          class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          创建面具
        </button>
      </div>
    </div>

    <!-- 创建面具对话框 -->
    <div v-if="showCreateDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">创建新面具</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称</label>
            <input
              v-model="newMask.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="输入面具名称"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">表情符号</label>
            <input
              v-model="newMask.emoji"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="选择一个表情符号"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
            <input
              v-model="newMask.description"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="输入简短描述"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">提示词</label>
            <textarea
              v-model="newMask.prompt"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="输入系统提示词"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">语言</label>
              <select
                v-model="newMask.language"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="中文">中文</option>
                <option value="英文">英文</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">分类</label>
              <select
                v-model="newMask.category"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="创意">创意</option>
                <option value="写作">写作</option>
                <option value="技术">技术</option>
                <option value="咨询">咨询</option>
                <option value="办公">办公</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button 
            @click="createMask"
            class="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            创建
          </button>
          <button 
            @click="showCreateDialog = false"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, Eye, Zap, Search, Plus, Star } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useMasks } from '@/hooks/useMasks'
import type { Mask } from '@/hooks/useMasks'

const router = useRouter()
const chatStore = useChatStore()
const { 
  masks, 
  searchQuery, 
  selectedLanguage, 
  selectedCategory,
  languages, 
  categories, 
  filteredMasks, 
  recommendedMasks,
  createMask: createNewMask,
  deleteMask: deleteExistingMask,
  incrementConversationCount 
} = useMasks()

const showRecommended = ref(false)
const showCreateDialog = ref(false)

const newMask = ref({
  name: '',
  emoji: '🤖',
  description: '',
  prompt: '',
  language: '中文',
  category: '其他'
})

const goBack = () => {
  router.push('/')
}

const startDirectly = () => {
  // 直接开始，不选择面具
  router.push('/')
}

const selectMask = (mask: Mask) => {
  // 创建新的对话并使用选中的面具
  chatStore.createMaskedConversation(mask.name, mask.description, mask.prompt)
  incrementConversationCount(mask.id)
  
  // 重定向到主页
  router.push('/')
}

const editMask = (mask: Mask) => {
  // TODO: 实现编辑功能
  console.log('编辑面具:', mask)
}

const viewMask = (mask: Mask) => {
  // TODO: 实现查看详情功能
  console.log('查看面具:', mask)
}

const deleteMask = (mask: Mask) => {
  if (confirm(`确定要删除面具 "${mask.name}" 吗？`)) {
    deleteExistingMask(mask.id)
  }
}

const createMask = () => {
  if (!newMask.value.name.trim()) {
    alert('请输入面具名称')
    return
  }
  
  createNewMask({
    name: newMask.value.name,
    emoji: newMask.value.emoji,
    description: newMask.value.description,
    prompt: newMask.value.prompt,
    language: newMask.value.language,
    category: newMask.value.category,
    model: 'GPT-4'
  })
  
  // 重置表单
  newMask.value = {
    name: '',
    emoji: '🤖',
    description: '',
    prompt: '',
    language: '中文',
    category: '其他'
  }
  
  showCreateDialog.value = false
}
</script>