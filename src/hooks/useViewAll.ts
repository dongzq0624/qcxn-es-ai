import { ref } from 'vue'

export function useViewAll() {
  const isViewAllMode = ref(false)
  const viewAllTitle = ref('查看全部')

  const openViewAll = () => {
    isViewAllMode.value = true
    viewAllTitle.value = '面具管理'
  }

  const closeViewAll = () => {
    isViewAllMode.value = false
    viewAllTitle.value = '查看全部'
  }

  const toggleViewAll = () => {
    isViewAllMode.value = !isViewAllMode.value
    viewAllTitle.value = isViewAllMode.value ? '面具管理' : '查看全部'
  }

  return {
    isViewAllMode,
    viewAllTitle,
    openViewAll,
    closeViewAll,
    toggleViewAll,
  }
}
