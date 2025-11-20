/**
 * JSON 转 Markdown 格式化工具
 * 确保JSON内容被正确格式化并包裹在Markdown代码块中
 */

export function formatJsonToMarkdown(jsonString: string): string {
  try {
    // 尝试解析JSON
    const parsed = JSON.parse(jsonString)

    // 美化JSON，使用4空格缩进以提高可读性
    const formattedJson = JSON.stringify(parsed, null, 2)

    // 确保返回的格式包含正确的换行符，避免渲染问题
    // 特别注意：使用实际的换行符而不是转义字符，确保与renderMarkdownHtml函数兼容
    return '## JSON 数据\n\n```json\n' + formattedJson + '\n```'
  } catch (error) {
    console.error('JSON格式化错误:', error)

    // 如果不是有效的JSON，尝试将其作为普通文本处理
    // 添加说明文本并将原始内容包裹在代码块中
    return '## JSON 解析失败\n\n以下内容不是有效的JSON格式：\n\n```\n' + jsonString + '\n```'
  }
}

function convertObjectToMarkdown(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent)

  if (Array.isArray(obj)) {
    return obj
      .map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return `${spaces}- ${convertObjectToMarkdown(item, indent + 1)}`
        } else {
          return `${spaces}- ${formatValue(item)}`
        }
      })
      .join('\n')
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${spaces}**${key}**: \n${convertObjectToMarkdown(value, indent + 1)}`
        } else {
          return `${spaces}**${key}**: ${formatValue(value)}`
        }
      })
      .join('\n')
  } else {
    return formatValue(obj)
  }
}

function formatValue(value: any): string {
  if (typeof value === 'string') {
    return value
  } else if (typeof value === 'number') {
    return value.toString()
  } else if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  } else if (value === null) {
    return 'null'
  } else if (value === undefined) {
    return 'undefined'
  } else {
    return String(value)
  }
}

/**
 * 检测字符串是否为JSON格式
 */
export function isJsonString(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch (error) {
    return false
  }
}

/**
 * 智能格式化消息内容
 * 处理各种格式的内容，确保与Markdown渲染兼容
 */
export function formatMessageContent(content: string): string {
  // 确保内容是字符串
  const safeContent = String(content || '').trim()

  if (!safeContent) {
    return ''
  }

  // 优先级1: 检查并处理JSON内容
  if (isJsonString(safeContent)) {
    return formatJsonToMarkdown(safeContent)
  }

  // 优先级2: 检查是否已包含完整的Markdown代码块（包含开始和结束标记）
  const codeBlockRegex = /```[\s\S]*?```/
  if (codeBlockRegex.test(safeContent)) {
    // 确保代码块格式正确，前后有适当的换行
    let formatted = safeContent

    // 在代码块前添加换行（如果需要）
    formatted = formatted.replace(/([^\n])```/g, '$1\n```')

    // 在代码块后添加换行（如果需要）
    formatted = formatted.replace(/```([^\n])/g, '```\n$1')

    return formatted
  }

  // 优先级3: 检查并处理表格格式
  if (isTableFormat(safeContent)) {
    return convertTableToMarkdown(safeContent)
  }

  // 优先级4: 检查并处理列表格式
  if (isListFormat(safeContent)) {
    return convertListToMarkdown(safeContent)
  }

  // 优先级5: 检查并处理键值对格式
  if (isKeyValueFormat(safeContent)) {
    return convertKeyValueToMarkdown(safeContent)
  }

  // 优先级6: 检查是否包含行内代码标记
  if (safeContent.includes('`')) {
    // 确保行内代码格式正确
    let formatted = safeContent
    // 处理可能的不平衡的代码标记
    const backtickCount = (safeContent.match(/`/g) || []).length
    if (backtickCount % 2 === 1) {
      // 如果代码标记数量为奇数，在末尾添加一个
      formatted += '`'
    }
    return formatted
  }

  // 优先级7: 检查是否包含链接格式
  if (/\[.*?\]\(.*?\)/.test(safeContent)) {
    return safeContent
  }

  // 最后: 处理为普通文本，添加基本格式化
  return formatPlainText(safeContent)
}

function isTableFormat(content: string): boolean {
  const lines = content.split('\n')
  return lines.length > 2 && lines.some((line) => line.includes('|') && line.split('|').length > 2)
}

function convertTableToMarkdown(content: string): string {
  const lines = content.split('\n')
  const tableLines = lines.filter((line) => line.includes('|'))

  if (tableLines.length < 2) return content

  // 添加表头分隔符
  const headerLine = tableLines[0]
  const separator = headerLine.replace(/[^|]/g, '-').replace(/\|/g, '|')

  const result = [headerLine, separator, ...tableLines.slice(1)].join('\n')

  return result
}

function isListFormat(content: string): boolean {
  const lines = content.split('\n')
  return lines.some((line) => /^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line))
}

function convertListToMarkdown(content: string): string {
  // 如果已经是Markdown列表格式，直接返回
  if (content.includes('- ') || content.includes('* ') || /^\d+\./.test(content)) {
    return content
  }

  // 将普通列表转换为Markdown格式
  const lines = content.split('\n')
  return lines
    .map((line) => {
      if (line.trim() && !line.startsWith('-') && !line.startsWith('*')) {
        return `- ${line}`
      }
      return line
    })
    .join('\n')
}

function isKeyValueFormat(content: string): boolean {
  const lines = content.split('\n')
  return lines.some((line) => /^\s*[^:\s]+:\s*.+/.test(line))
}

function convertKeyValueToMarkdown(content: string): string {
  const lines = content.split('\n')
  return lines
    .map((line) => {
      const match = line.match(/^\s*([^:\s]+):\s*(.+)/)
      if (match) {
        return `**${match[1]}**: ${match[2]}`
      }
      return line
    })
    .join('\n')
}

import { marked } from 'marked'
import hljs from 'highlight.js'

// 确保正确加载highlight.js样式（如果需要）
// import 'highlight.js/styles/github-dark.css'

// 初始化marked配置
marked.setOptions({
  breaks: true, // 将回车转换为<br>
  gfm: true, // 启用GitHub风格Markdown
  headerIds: true, // 为标题添加ID
  sanitize: false, // 不使用内置清理（我们使用DOMPurify）
  mangle: false, // 不自动添加nofollow到链接
  langPrefix: 'language-', // 代码块类名前缀
  highlight: function (code, lang) {
    // 使用highlight.js进行代码高亮
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error('代码高亮错误:', err)
      }
    }
    // 如果没有指定语言或高亮失败，尝试自动识别
    try {
      return hljs.highlightAuto(code).value
    } catch (err) {
      console.error('自动代码高亮错误:', err)
    }
    // 如果所有高亮都失败，返回HTML转义后的代码
    return escapeHtml(code)
  },
})

/**
 * 将 Markdown 渲染为 HTML
 * 特别优化了对JSON转Markdown内容的处理
 */
export const renderMarkdownHtml = (content: string): string => {
  // 参数安全检查
  const safeContent = String(content || '').trim()
  if (!safeContent) return ''

  try {
    // 特别处理JSON标题部分，确保格式正确
    let processedMarkdown = safeContent

    // 确保代码块格式正确（特别是针对JSON转Markdown的情况）
    processedMarkdown = processedMarkdown.replace(/```json\s*(.*?)(?=```)/gs, (match, content) => {
      // 确保代码块内容格式正确，添加必要的换行
      return '```json\n' + content.trim() + '\n'
    })

    // 确保所有代码块都有结束标记
    const codeBlockStartCount = (processedMarkdown.match(/```/g) || []).length
    if (codeBlockStartCount % 2 === 1) {
      // 如果代码块开始标记数量为奇数，在末尾添加结束标记
      processedMarkdown += '\n```'
    }

    // 渲染 Markdown 为 HTML
    let html = marked.parse(processedMarkdown)

    // 优化样式，添加适当的类
    html = applyStylesToHtml(html)

    return html
  } catch (error) {
    console.error('Markdown渲染错误:', error)

    // 尝试简化渲染作为备选方案
    try {
      // 使用更基本的方式处理，仅保留基本的HTML标签
      const basicHtml = escapeHtml(safeContent)
        .replace(/\n/g, '<br>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

      return `<div class="markdown-basic-render">${basicHtml}</div>`
    } catch (fallbackError) {
      console.error('备选渲染也失败:', fallbackError)
      // 返回安全的错误信息
      return `<p class="markdown-error">渲染Markdown时出错，请检查格式</p>`
    }
  }
}

// 为HTML元素应用样式的辅助函数
function applyStylesToHtml(html: string): string {
  // 优化表格样式
  html = html.replace(
    /<table>/g,
    '<table class="w-full border-collapse mb-4 border border-gray-300 dark:border-gray-700">'
  )
  html = html.replace(
    /<th>/g,
    '<th class="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left font-semibold">'
  )
  html = html.replace(/<td>/g, '<td class="border border-gray-300 dark:border-gray-700 px-4 py-2">')

  // 确保代码块有适当的样式
  html = html.replace(
    /<pre><code/g,
    '<pre class="p-4 rounded bg-gray-100 dark:bg-gray-800 overflow-x-auto my-4"><code'
  )
  // 为代码块添加语法高亮类
  html = html.replace(/<code class="/g, '<code class="font-mono text-sm ')

  // 处理链接样式
  html = html.replace(
    /<a /g,
    '<a class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" '
  )

  // 处理列表样式
  html = html.replace(/<ul>/g, '<ul class="list-disc pl-5 my-2 space-y-1">')
  html = html.replace(/<ol>/g, '<ol class="list-decimal pl-5 my-2 space-y-1">')
  html = html.replace(/<li>/g, '<li class="break-words">')

  // 处理段落样式
  html = html.replace(/<p>/g, '<p class="my-2 break-words">')

  // 处理标题样式
  html = html.replace(
    /<h1>/g,
    '<h1 class="text-2xl font-bold my-4 pb-2 border-b border-gray-200 dark:border-gray-700">'
  )
  html = html.replace(
    /<h2>/g,
    '<h2 class="text-xl font-bold my-3 pb-2 border-b border-gray-200 dark:border-gray-700">'
  )
  html = html.replace(/<h3>/g, '<h3 class="text-lg font-bold my-2">')
  html = html.replace(/<h4>/g, '<h4 class="text-base font-bold my-2">')
  html = html.replace(/<h5>/g, '<h5 class="text-sm font-bold my-2">')
  html = html.replace(/<h6>/g, '<h6 class="text-xs font-bold my-2">')

  // 处理引用样式
  html = html.replace(
    /<blockquote>/g,
    '<blockquote class="pl-4 border-l-4 border-blue-400 italic my-4 py-2 bg-gray-50 dark:bg-gray-800">'
  )

  // 处理加粗和斜体样式
  html = html.replace(/<strong>/g, '<strong class="font-bold">')
  html = html.replace(/<em>/g, '<em class="italic">')

  // 处理图片样式
  html = html.replace(/<img/g, '<img class="my-4 max-w-full rounded shadow-sm" ')

  // 处理水平分隔线样式
  html = html.replace(/<hr>/g, '<hr class="my-4 border-t border-gray-300 dark:border-gray-700">')

  // 处理代码内联样式
  html = html.replace(
    /<code>/g,
    '<code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-sm">'
  )

  return html
}

// HTML 转义函数
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>')
}

function formatPlainText(content: string): string {
  // 添加基本的Markdown格式化
  let formatted = content

  // 转换URL为链接
  formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '[$1]($1)')

  // 转换**加粗**文本
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '**$1**')

  // 转换*斜体*文本
  formatted = formatted.replace(/\*([^*]+)\*/g, '*$1*')

  // 转换`代码`文本
  formatted = formatted.replace(/`([^`]+)`/g, '`$1`')

  return formatted
}
