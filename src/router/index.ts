import { createRouter, createWebHistory } from 'vue-router'

// 定义路由配置
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomePage.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsPage.vue'),
  },
  {
    path: '/masks',
    name: 'masks',
    component: () => import('@/views/MasksPage.vue'),
  },
  {
    path: '/masks-management',
    name: 'masks-management',
    component: () => import('@/views/MasksManagementPage.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: {
      template: '<div class="text-center text-xl p-8">About Page - Coming Soon</div>',
    },
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
