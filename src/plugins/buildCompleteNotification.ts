/**
 * 自定义Vite插件：打包完成后输出提示信息
 * 功能：在构建完成时在控制台输出格式化的完成信息
 */

// 导入Vite插件类型定义
import type { Plugin } from 'vite'

/**
 * 创建构建完成提示插件
 * @returns Vite插件对象
 */
export function buildCompleteNotification(): Plugin {
  // 记录构建开始时间
  let startTime: number | null = null

  return {
    name: 'build-complete-notification',

    // 使用buildStart钩子，在构建开始时记录时间
    buildStart() {
      startTime = Date.now()
    },

    // 使用closeBundle钩子，在打包完成时触发
    closeBundle() {
      // 计算构建耗时，保留两位小数
      const endTime = Date.now()
      const buildTimeMs = startTime ? endTime - startTime : 0
      const buildTimeSeconds = buildTimeMs / 1000
      const formattedTime = buildTimeSeconds.toFixed(2)

      // 输出格式化的完成信息，包含耗时
      console.log('\n==================================')
      console.log('✅ 构建完成！')
      console.log(`⏱️  构建耗时: ${formattedTime} 秒`)
      console.log('📁 输出目录: qcxn-es-ai')
      console.log('🚀 项目已准备就绪，可以部署')
      console.log('==================================\n')
    },
  }
}
