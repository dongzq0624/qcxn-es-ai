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

  // API 配置
  const DEEPSEEK_API_KEY = 'sk-f3e2a86d8eb34f519eabe9fa84435024'
  const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

  const OPENAI_API_KEY = 'sk-BvUtwVQbhN6rb1mPuVrKtcE1UfKm33a0vT6QgZuVNuthsDLu'
  const OPENAI_API_BASE_URL = 'https://sg.uiuiapi.com/v1'
  const OPENAI_API_URL = `${OPENAI_API_BASE_URL}/chat/completions`

  const sendMessage = async (
    messages: Message[],
    model: string,
    settings: any
  ): Promise<string> => {
    isLoading.value = true
    error.value = null

    try {
      // 构建请求消息
      const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> =
        messages.map((msg) => ({
          role: msg.sender === 'system' ? 'system' : msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))

      // 如果没有系统消息，添加默认的系统消息（根据模型不同而不同）
      const hasSystemMessage = requestMessages.some((msg) => msg.role === 'system')
      if (!hasSystemMessage) {
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
          // DeepSeek 模型的系统消息 - 仿照OpenAI格式
          systemContent = `You are DeepSeek, a large language model trained by DeepSeek.
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
        requestMessages.unshift(systemMessage)
      }

      let actualModel = model
      let apiUrl = ''
      let apiKey = ''

      // 根据模型选择对应的API配置
      if (model === 'deepseek') {
        actualModel = 'deepseek-chat'
        apiUrl = DEEPSEEK_API_URL
        apiKey = DEEPSEEK_API_KEY
      } else if (model === 'gpt-3.5-turbo' || model === 'gpt-4') {
        apiUrl = OPENAI_API_URL
        apiKey = OPENAI_API_KEY
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

    try {
      // 构建请求消息
      const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> =
        messages.map((msg) => ({
          role: msg.sender === 'system' ? 'system' : msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))

      // 如果没有系统消息，添加默认的系统消息（根据模型不同而不同）
      const hasSystemMessage = requestMessages.some((msg) => msg.role === 'system')
      if (!hasSystemMessage) {
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
          // DeepSeek 模型的系统消息 - 仿照OpenAI格式
          systemContent = `You are DeepSeek, a large language model trained by DeepSeek.
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
        requestMessages.unshift(systemMessage)
      }

      let actualModel = model
      let apiUrl = ''
      let apiKey = ''

      // 根据模型选择对应的API配置
      if (model === 'deepseek') {
        actualModel = 'deepseek-chat'
        apiUrl = DEEPSEEK_API_URL
        apiKey = DEEPSEEK_API_KEY
      } else if (model === 'gpt-3.5-turbo' || model === 'gpt-4') {
        apiUrl = OPENAI_API_URL
        apiKey = OPENAI_API_KEY
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
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('API Error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    sendMessage,
    sendStreamingMessage,
  }
})
