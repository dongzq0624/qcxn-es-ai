<template>
  <div class="flex flex-1 flex-col bg-white dark:bg-gray-800">
    <!-- 顶部导航栏 -->
    <div
      class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-600"
    >
      <div class="flex items-center gap-3">
        <button
          @click="goBack"
          class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft class="h-5 w-5 text-gray-600 dark:text-gray-400" />
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
            'flex items-center gap-2 rounded-full border px-4 py-2 transition-colors',
            showRecommended
              ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
          ]"
        >
          <Star class="h-4 w-4" />
          推荐
        </button>
        <button
          @click="startDirectly"
          class="flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-white transition-colors hover:bg-teal-600"
        >
          <Zap class="h-4 w-4" />
          直接开始
        </button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
      <div class="flex flex-col gap-4 md:flex-row">
        <!-- 搜索框 -->
        <div class="relative flex-1">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索角色面具"
            class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <!-- 筛选下拉框 -->
        <div class="flex gap-2">
          <select
            v-model="selectedLanguage"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option v-for="lang in languages" :key="lang" :value="lang">
              {{ lang }}
            </option>
          </select>

          <select
            v-model="selectedCategory"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- 新建按钮 -->
        <button
          @click="showCreateDialog = true"
          class="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-white transition-colors hover:bg-teal-600"
        >
          <Plus class="h-4 w-4" />
          新建
        </button>
      </div>
    </div>

    <!-- 推荐面具预览 -->
    <div v-if="showRecommended" class="border-b border-gray-200 p-6 dark:border-gray-600">
      <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">推荐面具</h3>
      <div class="flex gap-4 overflow-x-auto pb-2">
        <div
          v-for="mask in recommendedMasks"
          :key="mask.id"
          @click="selectMask(mask)"
          class="flex h-24 w-24 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 text-2xl text-white shadow-lg transition-transform hover:scale-105"
        >
          {{ mask.emoji }}
        </div>
      </div>
    </div>

    <!-- 面具网格 -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="mask in filteredMasks"
          :key="mask.id"
          class="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-600 dark:bg-gray-700"
        >
          <!-- 面具头部 -->
          <div class="mb-4 flex items-center gap-4">
            <div class="text-3xl">{{ mask.emoji }}</div>
            <div class="flex-1">
              <h3
                class="font-semibold text-gray-800 group-hover:text-teal-600 dark:text-gray-200 dark:group-hover:text-teal-400"
              >
                {{ mask.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ mask.description }}</p>
            </div>
          </div>

          <!-- 面具信息 -->
          <div class="mb-4 space-y-2">
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
              <span class="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-600">
                {{ mask.category }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="selectMask(mask)"
              class="rounded-lg bg-teal-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
            >
              对话
            </button>
            <button
              @click="editMask(mask)"
              class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              编辑
            </button>
            <button
              @click="deleteMask(mask)"
              class="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              删除
            </button>
            <button
              @click="viewMask(mask)"
              class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              查看
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredMasks.length === 0" class="py-12 text-center">
        <div class="mb-4 text-6xl">🎭</div>
        <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">没有找到面具</h3>
        <p class="mb-4 text-gray-500 dark:text-gray-400">尝试调整搜索条件或创建新的面具</p>
        <button
          @click="showCreateDialog = true"
          class="rounded-lg bg-teal-500 px-4 py-2 text-white transition-colors hover:bg-teal-600"
        >
          创建面具
        </button>
      </div>
    </div>

    <!-- 创建面具对话框 -->
    <div
      v-if="showCreateDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-800">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">创建新面具</h3>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              名称
            </label>
            <input
              v-model="newMask.name"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="输入面具名称"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              表情符号
            </label>
            <input
              v-model="newMask.emoji"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="选择一个表情符号"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              描述
            </label>
            <input
              v-model="newMask.description"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="输入简短描述"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              提示词
            </label>
            <textarea
              v-model="newMask.prompt"
              rows="3"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="输入系统提示词"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                语言
              </label>
              <select
                v-model="newMask.language"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="中文">中文</option>
                <option value="英文">英文</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                分类
              </label>
              <select
                v-model="newMask.category"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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

        <div class="mt-6 flex gap-3">
          <button
            @click="createMask"
            class="flex-1 rounded-lg bg-teal-500 px-4 py-2 text-white transition-colors hover:bg-teal-600"
          >
            创建
          </button>
          <button
            @click="showCreateDialog = false"
            class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑面具对话框 -->
    <div
      v-if="showEditDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-800">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">编辑面具</h3>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              名称
            </label>
            <input
              v-model="editForm.name"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="输入面具名称"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              表情符号
            </label>
            <input
              v-model="editForm.emoji"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="选择一个表情符号"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              描述
            </label>
            <input
              v-model="editForm.description"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="输入简短描述"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              提示词
            </label>
            <textarea
              v-model="editForm.prompt"
              rows="3"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="输入系统提示词"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                语言
              </label>
              <select
                v-model="editForm.language"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="中文">中文</option>
                <option value="英文">英文</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                分类
              </label>
              <select
                v-model="editForm.category"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              模型
            </label>
            <select
              v-model="editForm.model"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="GPT-4">GPT-4</option>
              <option value="GPT-3.5">GPT-3.5</option>
            </select>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            @click="updateExistingMask"
            class="flex-1 rounded-lg bg-teal-500 px-4 py-2 text-white transition-colors hover:bg-teal-600"
          >
            保存
          </button>
          <button
            @click="showEditDialog = false"
            class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 查看面具对话框 -->
    <div
      v-if="showViewDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-800">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">面具详情</h3>

        <div v-if="viewingMask" class="space-y-4">
          <!-- 面具头部 -->
          <div class="flex items-center gap-4">
            <div class="text-4xl">{{ viewingMask.emoji }}</div>
            <div>
              <h4 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {{ viewingMask.name }}
              </h4>
              <p class="text-gray-500 dark:text-gray-400">{{ viewingMask.description }}</p>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                提示词
              </label>
              <div
                class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                style="white-space: pre-wrap; overflow-wrap: break-word"
              >
                {{ viewingMask.prompt }}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  语言
                </label>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {{ viewingMask.language || '中文' }}
                </div>
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  模型
                </label>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {{ viewingMask.model || 'GPT-4' }}
                </div>
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  分类
                </label>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {{ viewingMask.category || '其他' }}
                </div>
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  对话数
                </label>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {{ viewingMask.conversationCount || 0 }}
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              @click="showViewDialog = false"
              class="rounded-lg bg-teal-500 px-4 py-2 text-white transition-colors hover:bg-teal-600"
            >
              关闭
            </button>
          </div>
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
    updateMask,
    deleteMask: deleteExistingMask,
    incrementConversationCount,
  } = useMasks()

  const showRecommended = ref(false)
  const showCreateDialog = ref(false)

  const newMask = ref({
    name: '',
    emoji: '🤖',
    description: '',
    prompt: '',
    language: '中文',
    category: '其他',
  })

  // 编辑面具相关状态
  const showEditDialog = ref(false)
  const editingMask = ref<Mask | null>(null)
  const editForm = ref({
    name: '',
    emoji: '🤖',
    description: '',
    prompt: '',
    language: '中文',
    category: '其他',
    model: 'GPT-4',
  })

  // 查看面具相关状态
  const showViewDialog = ref(false)
  const viewingMask = ref<Mask | null>(null)

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
    editingMask.value = mask
    editForm.value = {
      name: mask.name,
      emoji: mask.emoji,
      description: mask.description,
      prompt: mask.prompt,
      language: mask.language || '中文',
      category: mask.category || '其他',
      model: mask.model || 'GPT-4',
    }
    showEditDialog.value = true
  }

  const viewMask = (mask: Mask) => {
    viewingMask.value = mask
    showViewDialog.value = true
  }

  const updateExistingMask = () => {
    if (!editingMask.value) return

    if (!editForm.value.name.trim()) {
      alert('请输入面具名称')
      return
    }

    updateMask(editingMask.value.id, editForm.value)
    showEditDialog.value = false
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
      model: 'GPT-4',
    })

    // 重置表单
    newMask.value = {
      name: '',
      emoji: '🤖',
      description: '',
      prompt: '',
      language: '中文',
      category: '其他',
    }

    showCreateDialog.value = false
  }
</script>
