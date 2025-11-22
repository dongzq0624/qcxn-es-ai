import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Message } from './chat'

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  stream: boolean
  model: string
  temperature: number
  presence_penalty: number
  frequency_penalty: number
  top_p: number
}

export interface ChatResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    index: number
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export const useApiStore = defineStore('api', () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentController = ref<AbortController | null>(null)
  const stopped = ref(false)

  // API 配置 - 从环境变量中读取
  const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
  const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
  const OPENAI_API_BASE_URL = import.meta.env.VITE_OPENAI_API_BASE_URL
  const OPENAI_API_URL = `${OPENAI_API_BASE_URL}/chat/completions`

  const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
  const ANTHROPIC_API_URL = import.meta.env.VITE_ANTHROPIC_API_URL

  const sendMessage = async (
    messages: Message[],
    model: string,
    settings: any
  ): Promise<string> => {
    isLoading.value = true
    error.value = null

    try {
      // 构建请求消息
      // 过滤掉content为空的assistant角色消息
      const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> =
        messages
          .filter((msg) => !(msg.sender === 'assistant' && !msg.content.trim()))
          .map((msg) => ({
            role: msg.sender === 'system' ? 'system' : msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
          }))

      // 总是使用对应模型的系统消息，替换已有的系统消息（如果有）
      let systemContent = ''

      if (model === 'gpt-3.5-turbo' || model === 'gpt-4') {
        // ChatGPT 模型的系统消息
        systemContent = `You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2021-09
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek') {
        // DeepSeek 基础模型的系统消息
        systemContent = `You are DeepSeek, a large language model trained by DeepSeek.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek-v3.1') {
        // DeepSeek V3.1 模型的系统消息
        systemContent = `You are DeepSeek V3.1 Chat, the latest generation large language model trained by DeepSeek.
You are optimized for natural language conversations with improved reasoning and knowledge capabilities.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek-v3.2-exp') {
        // DeepSeek V3.2-Exp 模型的系统消息
        systemContent = `You are DeepSeek V3.2-Exp, an experimental model with Sparse Attention mechanism trained by DeepSeek.
You have enhanced capabilities for handling complex queries and large contexts.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek-prover-v2') {
        // DeepSeek-Prover-V2-671B 模型的系统消息
        systemContent = `You are DeepSeek-Prover-V2-671B, a specialized large language model for mathematical theorem proving trained by DeepSeek.
You excel in formal mathematical reasoning and proof generation.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek-reasoner') {
        // DeepSeek-Reasoner 模型的系统消息
        systemContent = `You are DeepSeek-Reasoner, a specialized large language model optimized for complex reasoning tasks trained by DeepSeek.
You excel in step-by-step reasoning, logical analysis, and problem-solving.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else {
        // 默认系统消息
        systemContent = `You are a helpful AI assistant.
Current model: ${model}
Current time: ${new Date().toString()}

`
      }

      const systemMessage = {
        role: 'system' as const,
        content: systemContent,
      }

      // 检查是否已有系统消息
      const systemMessageIndex = requestMessages.findIndex((msg) => msg.role === 'system')
      if (systemMessageIndex !== -1) {
        // 替换已有的系统消息
        requestMessages[systemMessageIndex] = systemMessage
      } else {
        // 添加新的系统消息
        requestMessages.unshift(systemMessage)
      }

      let actualModel = model
      let apiUrl = ''
      let apiKey = ''

      // 根据模型选择对应的API配置
      if (model.startsWith('deepseek') && model !== 'deepseek-reasoner') {
        // 所有DeepSeek聊天模型的actualModel均为deepseek-chat
        actualModel = 'deepseek-chat'
        apiUrl = DEEPSEEK_API_URL
        apiKey = DEEPSEEK_API_KEY
      } else if (model === 'deepseek-reasoner') {
        // DeepSeek推理模型的actualModel为deepseek-reasoner
        actualModel = 'deepseek-reasoner'
        apiUrl = DEEPSEEK_API_URL
        apiKey = DEEPSEEK_API_KEY
      } else if (
        model === 'gpt-3.5-turbo' ||
        model === 'gpt-4' ||
        model === 'gpt-4-turbo' ||
        model === 'claude-3.5'
      ) {
        // 保持其他模型的处理逻辑
        if (model.includes('gpt')) {
          apiUrl = OPENAI_API_URL
          apiKey = OPENAI_API_KEY
          actualModel = model
        } else {
          // Claude 模型
          apiUrl = ANTHROPIC_API_URL
          apiKey = ANTHROPIC_API_KEY
          actualModel = model
        }
      } else {
        // 默认使用 DeepSeek
        actualModel = 'deepseek-chat'
        apiUrl = DEEPSEEK_API_URL
        apiKey = DEEPSEEK_API_KEY
      }

      console.log('Using model:', actualModel)
      console.log('API URL:', apiUrl)
      // console.log('Request messages:', requestMessages)

      const requestBody: ChatRequest = {
        messages: requestMessages,
        stream: true, // 启用流式响应
        model: actualModel,
        temperature: settings.temperature || 0.5,
        presence_penalty: settings.presencePenalty || 0,
        frequency_penalty: settings.frequencyPenalty || 0,
        top_p: settings.topP || 1,
      }

      // console.log('Request body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error?.message || errorMessage
        } catch (e) {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullContent += content
              }
            } catch (e) {
              console.warn('Failed to parse streaming data:', e)
            }
          }
        }
      }

      return fullContent
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('API Error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const sendStreamingMessage = async (
    messages: Message[],
    model: string,
    settings: any,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    isLoading.value = true
    error.value = null
    stopped.value = false
    const controller = new AbortController()
    currentController.value = controller

    try {
      // 构建请求消息
      // 过滤掉content为空的assistant角色消息
      const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> =
        messages
          .filter((msg) => !(msg.sender === 'assistant' && !msg.content.trim()))
          .map((msg) => ({
            role: msg.sender === 'system' ? 'system' : msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
          }))

      // 总是使用对应模型的系统消息，替换已有的系统消息（如果有）
      let systemContent = ''

      if (model === 'gpt-3.5-turbo' || model === 'gpt-4') {
        // ChatGPT 模型的系统消息
        systemContent = `You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2021-09
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek') {
        // DeepSeek 基础模型的系统消息
        systemContent = `You are DeepSeek, a large language model trained by DeepSeek.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek-v3.1') {
        // DeepSeek V3.1 模型的系统消息
        systemContent = `You are DeepSeek V3.1 Chat, the latest generation large language model trained by DeepSeek.
You are optimized for natural language conversations with improved reasoning and knowledge capabilities.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek-v3.2-exp') {
        // DeepSeek V3.2-Exp 模型的系统消息
        systemContent = `You are DeepSeek V3.2-Exp, an experimental model with Sparse Attention mechanism trained by DeepSeek.
You have enhanced capabilities for handling complex queries and large contexts.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek-prover-v2') {
        // DeepSeek-Prover-V2-671B 模型的系统消息
        systemContent = `You are DeepSeek-Prover-V2-671B, a specialized large language model for mathematical theorem proving trained by DeepSeek.
You excel in formal mathematical reasoning and proof generation.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else if (model === 'deepseek-reasoner') {
        // DeepSeek-Reasoner 模型的系统消息
        systemContent = `You are DeepSeek-Reasoner, a specialized large language model optimized for complex reasoning tasks trained by DeepSeek.
You excel in step-by-step reasoning, logical analysis, and problem-solving.
Current model: ${model}
Current time: ${new Date().toString()}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$

`
      } else {
        // 默认系统消息
        systemContent = `You are a helpful AI assistant.
Current model: ${model}
Current time: ${new Date().toString()}

`
      }

      const systemMessage = {
        role: 'system' as const,
        content: systemContent,
      }

      // 检查是否已有系统消息
      const systemMessageIndex = requestMessages.findIndex((msg) => msg.role === 'system')
      if (systemMessageIndex !== -1) {
        // 替换已有的系统消息
        requestMessages[systemMessageIndex] = systemMessage
      } else {
        // 添加新的系统消息
        requestMessages.unshift(systemMessage)
      }

      let actualModel = model
      let apiUrl = ''
      let apiKey = ''

      // 根据模型选择对应的API配置
      if (model.startsWith('deepseek') && model !== 'deepseek-reasoner') {
        // 所有DeepSeek聊天模型的actualModel均为deepseek-chat
        actualModel = 'deepseek-chat'
        apiUrl = DEEPSEEK_API_URL
        apiKey = DEEPSEEK_API_KEY
      } else if (model === 'deepseek-reasoner') {
        // DeepSeek推理模型的actualModel为deepseek-reasoner
        actualModel = 'deepseek-reasoner'
        apiUrl = DEEPSEEK_API_URL
        apiKey = DEEPSEEK_API_KEY
      } else if (
        model === 'gpt-3.5-turbo' ||
        model === 'gpt-4' ||
        model === 'gpt-4-turbo' ||
        model === 'claude-3.5'
      ) {
        // 保持其他模型的处理逻辑
        if (model.includes('gpt')) {
          apiUrl = OPENAI_API_URL
          apiKey = OPENAI_API_KEY
          actualModel = model
        } else {
          // Claude 模型
          apiUrl = ANTHROPIC_API_URL
          apiKey = ANTHROPIC_API_KEY
          actualModel = model
        }
      } else {
        // 默认使用 DeepSeek
        actualModel = 'deepseek-chat'
        apiUrl = DEEPSEEK_API_URL
        apiKey = DEEPSEEK_API_KEY
      }

      console.log('Using model:', actualModel)
      console.log('API URL:', apiUrl)
      console.log('Request messages:', requestMessages)

      const requestBody: ChatRequest = {
        messages: requestMessages,
        stream: true, // 启用流式响应
        model: actualModel,
        temperature: settings.temperature || 0.5,
        presence_penalty: settings.presencePenalty || 0,
        frequency_penalty: settings.frequencyPenalty || 0,
        top_p: settings.topP || 1,
      }

      console.log('Request body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error?.message || errorMessage
        } catch (e) {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              console.warn('Failed to parse streaming data:', e)
            }
          }
        }
      }
    } catch (err) {
      if (stopped.value) {
        error.value = null
        return
      }
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('API Error:', err)
      throw err
    } finally {
      isLoading.value = false
      currentController.value = null
    }
  }

  const stopStreaming = () => {
    stopped.value = true
    if (currentController.value) {
      try {
        currentController.value.abort()
      } catch (e) {
        error.value = null
      }
    }
  }

  return {
    isLoading,
    error,
    sendMessage,
    sendStreamingMessage,
    stopStreaming,
  }
})
