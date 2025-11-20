<template>
  <div class="typewriter-container">
    <div 
      ref="contentRef"
      class="markdown-content"
      v-html="renderedContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { marked } from 'marked'

interface Props {
  text: string
  onComplete?: () => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  complete: []
}>()

const contentRef = ref<HTMLElement>()
const renderedContent = ref('')

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true
})

// 直接渲染完整文本，没有打字机效果
const renderText = () => {
  if (!props.text) {
    renderedContent.value = ''
    return
  }
  
  // 直接渲染完整的 markdown 内容
  renderedContent.value = marked(props.text) as string
  
  // 触发完成事件
  nextTick(() => {
    emit('complete')
    props.onComplete?.()
  })
}

// 监听文本变化
watch(() => props.text, (newText, oldText) => {
  if (newText && newText !== oldText) {
    renderText()
  } else if (!newText) {
    renderedContent.value = ''
  }
}, { immediate: true })
</script>

<style scoped>
.typewriter-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.markdown-content {
  display: inline;
  overflow-wrap: break-word;
}

/* 代码块样式 */
.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
  font-size: 85%;
  line-height: 1.45;
}

.dark .markdown-content :deep(pre) {
  background-color: #161b22;
  border: 1px solid #30363d;
}

.markdown-content :deep(code) {
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}

/* 行内代码样式 */
.markdown-content :deep(code:not(pre code)) {
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
}

.dark .markdown-content :deep(code:not(pre code)) {
  background-color: rgba(110, 118, 129, 0.4);
}

/* 段落样式 */
.markdown-content :deep(p) {
  margin: 0 0 16px;
  line-height: 1.6;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* 标题样式 */
.markdown-content :deep(h1), 
.markdown-content :deep(h2), 
.markdown-content :deep(h3), 
.markdown-content :deep(h4), 
.markdown-content :deep(h5), 
.markdown-content :deep(h6) {
  margin: 24px 0 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #1f2328;
}

.dark .markdown-content :deep(h1),
.dark .markdown-content :deep(h2),
.dark .markdown-content :deep(h3),
.dark .markdown-content :deep(h4),
.dark .markdown-content :deep(h5),
.dark .markdown-content :deep(h6) {
  color: #f0f6fc;
}

.markdown-content :deep(h1) { font-size: 2em; }
.markdown-content :deep(h2) { font-size: 1.5em; }
.markdown-content :deep(h3) { font-size: 1.25em; }
.markdown-content :deep(h4) { font-size: 1em; }
.markdown-content :deep(h5) { font-size: 0.875em; }
.markdown-content :deep(h6) { font-size: 0.85em; }

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

/* 引用样式 */
.markdown-content :deep(blockquote) {
  margin: 0 0 16px;
  padding: 0 1em;
  color: #656d76;
  border-left: 0.25em solid #d0d7de;
  background-color: transparent;
}

.dark .markdown-content :deep(blockquote) {
  color: #8b949e;
  border-left-color: #3d444d;
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

/* 链接样式 */
.markdown-content :deep(a) {
  color: #0969da;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.dark .markdown-content :deep(a) {
  color: #58a6ff;
}

/* 分割线样式 */
.markdown-content :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #d0d7de;
  border: 0;
}

.dark .markdown-content :deep(hr) {
  background-color: #30363d;
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