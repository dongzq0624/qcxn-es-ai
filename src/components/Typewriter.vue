<template>
  <div class="typewriter-container">
    <div ref="contentRef" class="markdown-content deepseek-markdown" v-html="renderedContent" />
    <!-- DeepSeek风格的光标指示器 -->
    <div v-if="isTyping && !props.streaming" class="typing-cursor"></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, nextTick, onUnmounted, computed } from 'vue'
  import { marked } from 'marked'
  import hljs from 'highlight.js'

  interface Props {
    text: string
    onComplete?: () => void
    streaming?: boolean // 是否处于流式传输中
  }

  const props = withDefaults(defineProps<Props>(), {
    streaming: false,
  })

  const emit = defineEmits<{
    complete: []
  }>()

  const contentRef = ref<HTMLElement>()
  const currentText = ref('')
  const renderedContent = ref('')
  const isTyping = ref(false)
  const typeIndex = ref(0)
  const typingTimer = ref<number | null>(null)

  // 配置 marked 选项
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value
        } catch (err) {
          console.error('代码高亮失败:', err)
        }
      }
      return hljs.highlightAuto(code).value
    },
    langPrefix: 'hljs language-',
  })

  // 确保文本中的换行符被正确处理
  const processedText = computed(() => {
    if (!props.text) return ''
    // 确保换行符是 \n 而不是 \r\n 或其他格式
    return props.text.replace(/\r\n|\r/g, '\n')
  })

  // 真正的打字机效果实现
  const typeText = () => {
    // 清除之前的定时器
    if (typingTimer.value !== null) {
      clearTimeout(typingTimer.value)
      typingTimer.value = null
    }

    if (props.streaming) {
      // 流式传输模式 - 直接渲染当前所有文本
      currentText.value = processedText.value
      // 为DeepSeek风格处理，添加特殊格式
      const formattedText = formatForDeepSeek(currentText.value)
      renderedContent.value = marked(formattedText) as string

      // 应用代码高亮
      nextTick(() => {
        if (contentRef.value) {
          hljs.highlightAll()
        }
      })

      // 不触发完成事件，因为流式传输还在继续
    } else {
      // 非流式传输 - 打字机效果
      isTyping.value = true
      typeIndex.value = 0
      currentText.value = ''

      // 打字机效果函数
      const typeChar = () => {
        if (typeIndex.value < processedText.value.length) {
          // 添加当前字符
          currentText.value += processedText.value[typeIndex.value]
          typeIndex.value++

          // 为DeepSeek风格处理，添加特殊格式
          const formattedText = formatForDeepSeek(currentText.value)
          // 渲染当前文本
          renderedContent.value = marked(formattedText) as string

          // 应用代码高亮
          nextTick(() => {
            if (contentRef.value) {
              hljs.highlightAll()
            }
          })

          // 计算下一个字符的延迟（简单的打字速度变化）
          let delay = 20 // 基础延迟

          // 根据字符类型调整延迟
          const currentChar = processedText.value[typeIndex.value - 1]
          if (currentChar === '\n') {
            delay = 100 // 换行符稍作停顿
          } else if (currentChar === ' ') {
            delay = 30 // 空格稍快
          } else if (['.', '!', '?'].includes(currentChar)) {
            delay = 100 // 句子结束符号稍作停顿
          }

          // 随机微调延迟，使打字效果更自然
          delay += Math.random() * 20 - 10

          typingTimer.value = setTimeout(typeChar, delay) as unknown as number
        } else {
          // 打字完成
          isTyping.value = false

          // 触发完成事件
          nextTick(() => {
            emit('complete')
            props.onComplete?.()
          })
        }
      }

      // 开始打字
      typeChar()
    }
  }

  // DeepSeek风格的文本格式化函数
  const formatForDeepSeek = (text: string): string => {
    // 处理标题样式，使更符合DeepSeek风格
    text = text.replace(/^# (.*$)/gm, '# $1') // 保持原格式但会通过CSS增强显示

    // 处理代码块，确保语法高亮正确应用
    text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
      // 确保代码块格式正确
      return match
    })

    // 处理表格，使更符合DeepSeek风格
    text = text.replace(/\|([^|]+)\|\n\|([^|]+)\|([\s\S]*?)\n/g, (match) => {
      // 保持原格式但会通过CSS增强显示
      return match
    })

    return text
  }

  // 监听文本变化
  watch(
    () => props.text,
    (newText, oldText) => {
      if (newText !== oldText) {
        typeText()
      } else if (!newText) {
        currentText.value = ''
        renderedContent.value = ''
      }
    },
    { immediate: true }
  )

  // 组件卸载时清理定时器
  onUnmounted(() => {
    if (typingTimer.value !== null) {
      clearTimeout(typingTimer.value)
    }
  })
</script>

<style scoped>
  .typewriter-container {
    position: relative;
    display: inline-block;
    width: 100%;
    min-height: 1.5em;
  }

  .markdown-content {
    display: inline;
    overflow-wrap: break-word;
  }

  /* DeepSeek风格的Markdown容器 */
  .deepseek-markdown {
    font-size: 14px;
    line-height: 1.6;
  }

  /* DeepSeek风格的打字光标 */
  .typing-cursor {
    display: inline-block;
    width: 2px;
    height: 1.1em;
    background-color: #06f;
    animation: cursor-blink 1.2s infinite;
    vertical-align: text-bottom;
    margin-left: 1px;
  }

  @keyframes cursor-blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }

  /* DeepSeek风格的代码块样式 */
  .markdown-content :deep(pre) {
    background-color: #f7f9fc;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 16px 0;
    font-size: 13px;
    line-height: 1.5;
    border: 1px solid #e1e5e9;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .dark .markdown-content :deep(pre) {
    background-color: #181a1b;
    border: 1px solid #2d333b;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .markdown-content :deep(code) {
    font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
  }

  /* DeepSeek风格的行内代码样式 */
  .markdown-content :deep(code:not(pre code)) {
    background-color: rgba(0, 102, 255, 0.1);
    border-radius: 4px;
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    color: #06f;
  }

  .dark .markdown-content :deep(code:not(pre code)) {
    background-color: rgba(0, 102, 255, 0.2);
    color: #5e9eff;
  }

  /* DeepSeek风格的段落样式 */
  .markdown-content :deep(p) {
    margin: 0 0 16px;
    line-height: 1.7;
    color: #4a5568;
  }

  .dark .markdown-content :deep(p) {
    color: #cbd5e0;
  }

  .markdown-content :deep(p:last-child) {
    margin-bottom: 0;
  }

  /* DeepSeek风格的标题样式 */
  .markdown-content :deep(h1),
  .markdown-content :deep(h2),
  .markdown-content :deep(h3),
  .markdown-content :deep(h4),
  .markdown-content :deep(h5),
  .markdown-content :deep(h6) {
    margin: 24px 0 16px;
    font-weight: 600;
    line-height: 1.3;
    color: #1a202c;
    letter-spacing: -0.01em;
  }

  .dark .markdown-content :deep(h1),
  .dark .markdown-content :deep(h2),
  .dark .markdown-content :deep(h3),
  .dark .markdown-content :deep(h4),
  .dark .markdown-content :deep(h5),
  .dark .markdown-content :deep(h6) {
    color: #f7fafc;
  }

  /* 增强标题视觉效果 */
  .markdown-content :deep(h1)::after,
  .markdown-content :deep(h2)::after {
    content: '';
    display: block;
    width: 100%;
    height: 1px;
    background: linear-gradient(to right, #06f 0%, rgba(0, 102, 255, 0.2) 100%);
    margin-top: 0.3em;
  }

  .dark .markdown-content :deep(h1)::after,
  .dark .markdown-content :deep(h2)::after {
    background: linear-gradient(to right, #5e9eff 0%, rgba(94, 158, 255, 0.2) 100%);
  }

  .markdown-content :deep(h1) {
    font-size: 2em;
  }
  .markdown-content :deep(h2) {
    font-size: 1.5em;
  }
  .markdown-content :deep(h3) {
    font-size: 1.25em;
  }
  .markdown-content :deep(h4) {
    font-size: 1em;
  }
  .markdown-content :deep(h5) {
    font-size: 0.875em;
  }
  .markdown-content :deep(h6) {
    font-size: 0.85em;
  }

  /* 列表样式 */
  .markdown-content :deep(ul),
  .markdown-content :deep(ol) {
    margin: 0 0 16px;
    padding-left: 2em;
  }

  .markdown-content :deep(li) {
    margin: 0.25em 0;
  }

  .markdown-content :deep(li:last-child) {
    margin-bottom: 0;
  }

  /* DeepSeek风格的引用样式 */
  .markdown-content :deep(blockquote) {
    margin: 0 0 16px;
    padding: 12px 16px 12px 20px;
    color: #4a5568;
    border-left: 4px solid #06f;
    background-color: #f7f9fc;
    border-radius: 0 8px 8px 0;
  }

  .dark .markdown-content :deep(blockquote) {
    color: #cbd5e0;
    background-color: rgba(0, 102, 255, 0.05);
    border-left-color: #5e9eff;
  }

  /* 图片样式 */
  .markdown-content :deep(img) {
    max-width: 100%;
    height: auto;
    box-sizing: content-box;
  }

  /* 表格样式 */
  .markdown-content :deep(table) {
    border-collapse: collapse;
    border-spacing: 0;
    margin: 16px 0;
    width: 100%;
    overflow: auto;
    font-size: 85%;
    line-height: 1.5;
  }

  .markdown-content :deep(table th),
  .markdown-content :deep(table td) {
    padding: 6px 13px;
    border: 1px solid #d0d7de;
  }

  .markdown-content :deep(table th) {
    background-color: #f6f8fa;
    font-weight: 600;
  }

  .dark .markdown-content :deep(table th) {
    background-color: #161b22;
    color: #f0f6fc;
  }

  .dark .markdown-content :deep(table td) {
    border-color: #30363d;
  }

  /* DeepSeek风格的链接样式 */
  .markdown-content :deep(a) {
    color: #06f;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .markdown-content :deep(a:hover) {
    text-decoration: underline;
    color: #004fc4;
  }

  .dark .markdown-content :deep(a) {
    color: #5e9eff;
  }

  .dark .markdown-content :deep(a:hover) {
    color: #8ab9ff;
  }

  /* DeepSeek风格的分割线样式 */
  .markdown-content :deep(hr) {
    height: 1px;
    padding: 0;
    margin: 32px 0;
    background: linear-gradient(to right, transparent 0%, #e1e5e9 50%, transparent 100%);
    border: 0;
  }

  .dark .markdown-content :deep(hr) {
    background: linear-gradient(to right, transparent 0%, #2d333b 50%, transparent 100%);
  }

  /* 任务列表样式 */
  .markdown-content :deep(.task-list-item) {
    list-style-type: none;
  }

  .markdown-content :deep(.task-list-item input) {
    margin: 0 0.2em 0.25em -1.6em;
    vertical-align: middle;
  }
</style>
