/**
 * JSON 转 Markdown 格式化工具
 */

export function formatJsonToMarkdown(jsonString: string): string {
  try {
    // 尝试解析JSON
    const parsed = JSON.parse(jsonString)
    return convertObjectToMarkdown(parsed)
  } catch (error) {
    // 如果不是有效的JSON，返回原始字符串
    return jsonString
  }
}

function convertObjectToMarkdown(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent)
  
  if (Array.isArray(obj)) {
    return obj.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return `${spaces}- ${convertObjectToMarkdown(item, indent + 1)}`
      } else {
        return `${spaces}- ${formatValue(item)}`
      }
    }).join('\n')
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${spaces}**${key}**: \n${convertObjectToMarkdown(value, indent + 1)}`
      } else {
        return `${spaces}**${key}**: ${formatValue(value)}`
      }
    }).join('\n')
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
 */
export function formatMessageContent(content: string): string {
  // 如果是JSON字符串，转换为Markdown格式
  if (isJsonString(content)) {
    return formatJsonToMarkdown(content)
  }
  
  // 如果是代码块，保持原样
  if (content.includes('```')) {
    return content
  }
  
  // 如果是表格格式，转换为Markdown表格
  if (isTableFormat(content)) {
    return convertTableToMarkdown(content)
  }
  
  // 如果是列表格式，转换为Markdown列表
  if (isListFormat(content)) {
    return convertListToMarkdown(content)
  }
  
  // 如果是键值对格式，转换为Markdown格式
  if (isKeyValueFormat(content)) {
    return convertKeyValueToMarkdown(content)
  }
  
  // 普通文本，添加基本格式化
  return formatPlainText(content)
}

function isTableFormat(content: string): boolean {
  const lines = content.split('\n')
  return lines.length > 2 && lines.some(line => line.includes('|') && line.split('|').length > 2)
}

function convertTableToMarkdown(content: string): string {
  const lines = content.split('\n')
  const tableLines = lines.filter(line => line.includes('|'))
  
  if (tableLines.length < 2) return content
  
  // 添加表头分隔符
  const headerLine = tableLines[0]
  const separator = headerLine.replace(/[^|]/g, '-').replace(/\|/g, '|')
  
  const result = [
    headerLine,
    separator,
    ...tableLines.slice(1)
  ].join('\n')
  
  return result
}

function isListFormat(content: string): boolean {
  const lines = content.split('\n')
  return lines.some(line => /^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line))
}

function convertListToMarkdown(content: string): string {
  // 如果已经是Markdown列表格式，直接返回
  if (content.includes('- ') || content.includes('* ') || /^\d+\./.test(content)) {
    return content
  }
  
  // 将普通列表转换为Markdown格式
  const lines = content.split('\n')
  return lines.map(line => {
    if (line.trim() && !line.startsWith('-') && !line.startsWith('*')) {
      return `- ${line}`
    }
    return line
  }).join('\n')
}

function isKeyValueFormat(content: string): boolean {
  const lines = content.split('\n')
  return lines.some(line => /^\s*[^:\s]+:\s*.+/.test(line))
}

function convertKeyValueToMarkdown(content: string): string {
  const lines = content.split('\n')
  return lines.map(line => {
    const match = line.match(/^\s*([^:\s]+):\s*(.+)/)
    if (match) {
      return `**${match[1]}**: ${match[2]}`
    }
    return line
  }).join('\n')
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