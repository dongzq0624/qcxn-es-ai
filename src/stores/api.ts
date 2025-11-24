import { defineStore } from 'pinia'
import { ref, onMounted, onUnmounted } from 'vue'
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
  const isOnline = ref(navigator.onLine) // 网络状态
  const lastOfflineTime = ref<Date | null>(null) // 上次离线时间
  const isPollingActive = ref(false) // 轮询是否激活
  const lastSuccessfulPingTime = ref<Date | null>(null) // 上次成功ping的时间

  // 重试配置
  const retryConfig = {
    maxRetries: 3, // 最大重试次数
    baseDelay: 1000, // 基础延迟时间（毫秒）
    maxDelay: 8000, // 最大延迟时间（毫秒）
    // 可重试的错误状态码
    retryableStatusCodes: [429, 500, 502, 503, 504],
    // 判断错误是否可重试的函数
    isRetryableError: (err: any): boolean => {
      // 网络错误可重试
      if (!navigator.onLine) return true
      // 特定HTTP状态码可重试
      if (err.message && typeof err.message === 'string') {
        const statusMatch = err.message.match(/HTTP error! status: (\d+)/)
        if (statusMatch) {
          const statusCode = parseInt(statusMatch[1])
          return retryConfig.retryableStatusCodes.includes(statusCode)
        }
      }
      // 其他网络相关错误
      return ['NetworkError', 'TypeError'].some(
        (type) => err.name === type || (err.message && err.message.includes(type))
      )
    },
  }

  // API 配置 - 从环境变量中读取
  const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
  const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
  const OPENAI_API_BASE_URL = import.meta.env.VITE_OPENAI_API_BASE_URL
  const OPENAI_API_URL = `${OPENAI_API_BASE_URL}/chat/completions`

  const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
  const ANTHROPIC_API_URL = import.meta.env.VITE_ANTHROPIC_API_URL

  // 构建请求消息和配置的辅助函数
  const prepareRequestConfig = (messages: Message[], model: string, settings: any) => {
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

    const requestBody: ChatRequest = {
      messages: requestMessages,
      stream: true, // 启用流式响应
      model: actualModel,
      temperature: settings.temperature || 0.5,
      presence_penalty: settings.presencePenalty || 0,
      frequency_penalty: settings.frequencyPenalty || 0,
      top_p: settings.topP || 1,
    }

    return {
      apiUrl,
      apiKey,
      requestBody,
      actualModel,
    }
  }

  const sendStreamingMessage = async (
    messages: Message[],
    model: string,
    settings: any,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    // 创建新的控制器，确保不使用已中止的控制器
    const controller = new AbortController()
    currentController.value = controller

    // 将控制器添加到活动控制器集合中
    activeControllers.value.add(controller)

    isLoading.value = true
    error.value = null
    stopped.value = false

    // 记录请求开始时间，用于日志和超时检测
    const requestStartTime = new Date().toISOString()
    console.log(`开始流式请求，时间: ${requestStartTime}`)

    try {
      await withRetry(
        async () => {
          // 如果请求已被用户停止，不再重试
          if (stopped.value) {
            throw new Error('Request stopped by user')
          }

          // 检查网络状态，如果不在线则添加到待重试列表
          if (!navigator.onLine) {
            console.log('网络不在线，添加到待重试队列')
            pendingRetryRequests.value.push({ messages, model, settings, onChunk })
            throw new Error('网络连接不可用，请求已添加到重试队列')
          }

          const { apiUrl, apiKey, requestBody } = prepareRequestConfig(messages, model, settings)
          console.log('Request messages:', requestBody.messages)
          console.log('Request body:', JSON.stringify(requestBody, null, 2))

          // 在fetch前再次检查网络状态，防止状态变化
          if (!navigator.onLine || stopped.value || controller.signal.aborted) {
            if (!navigator.onLine) {
              console.log('fetch前检测到网络离线，取消请求')
              pendingRetryRequests.value.push({ messages, model, settings, onChunk })
              throw new Error('网络连接不可用，请求已添加到重试队列')
            }
            if (stopped.value) throw new Error('Request stopped by user')
            if (controller.signal.aborted) throw new Error('Request aborted')
          }

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
          let lastActivityTime = Date.now()

          while (true) {
            // 检查是否已停止
            if (stopped.value) {
              throw new Error('Request stopped by user')
            }

            // 检查网络状态
            if (!navigator.onLine) {
              console.log('网络连接中断，添加到待重试队列')
              pendingRetryRequests.value.push({ messages, model, settings, onChunk })
              // 显式中止控制器
              controller.abort()
              throw new Error('网络连接中断，请求已添加到重试队列')
            }

            // 在读取之前再次检查控制器是否已被中止
            if (controller.signal.aborted) {
              console.log('控制器已被中止，停止读取数据')
              throw new Error('Request aborted due to network disconnection')
            }

            // 尝试使用带超时的读取操作，提高对网络变化的响应速度
            const readPromise = reader.read()
            const timeoutPromise = new Promise<{ done: boolean; value: Uint8Array | undefined }>(
              (_, reject) => setTimeout(() => reject(new Error('Read timeout')), 3000)
            )

            let result
            try {
              // 使用Promise.race来实现超时机制
              result = await Promise.race([readPromise, timeoutPromise])
            } catch (timeoutErr) {
              // 超时后检查网络状态
              if (!navigator.onLine) {
                console.log('读取超时，检测到网络离线')
                pendingRetryRequests.value.push({ messages, model, settings, onChunk })
                controller.abort()
                throw new Error('网络连接中断，请求已添加到重试队列')
              }
              // 如果网络正常，可能是服务器延迟，继续等待
              console.warn('读取超时，但网络正常，继续尝试')
              result = await readPromise // 不使用超时再次尝试读取
            }

            const { done, value } = result
            if (done) break

            // 更新最后活动时间
            lastActivityTime = Date.now()

            // 再次检查网络状态和中止状态
            if (!navigator.onLine || controller.signal.aborted) {
              if (!navigator.onLine) {
                pendingRetryRequests.value.push({ messages, model, settings, onChunk })
              }
              throw new Error(
                navigator.onLine ? 'Request aborted' : '网络连接中断，请求已添加到重试队列'
              )
            }

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
                    // 在回调前再次检查网络状态
                    if (!navigator.onLine || stopped.value || controller.signal.aborted) {
                      if (!navigator.onLine) {
                        pendingRetryRequests.value.push({ messages, model, settings, onChunk })
                      }
                      throw new Error('网络连接中断或请求已停止')
                    }
                    onChunk(content)
                  }
                } catch (e) {
                  console.warn('Failed to parse streaming data:', e)
                }
              }
            }
          }
        },
        (err) => {
          // 自定义重试逻辑：如果是用户停止的请求，则不重试
          if (stopped.value || (err.message && err.message.includes('Request stopped by user'))) {
            return false
          }

          // 如果是网络错误且已添加到待重试队列，则不进行立即重试
          if (err.message && err.message.includes('已添加到重试队列')) {
            return false
          }

          // 如果是因为网络断开导致的中止，则不重试
          if (err.message && err.message.includes('aborted due to network disconnection')) {
            return false
          }

          // 如果是读取超时但网络状态正常，可能是服务器延迟，可以重试
          if (err.message === 'Read timeout' && navigator.onLine) {
            return true
          }

          return retryConfig.isRetryableError(err)
        }
      )
    } catch (err) {
      console.log(`请求结束，时间: ${new Date().toISOString()}, 错误:`, err.message || err)

      if (stopped.value) {
        error.value = null
        return
      }

      // 不显示已添加到重试队列的错误和网络断开导致的中止错误
      if (
        !(
          err instanceof Error &&
          (err.message.includes('已添加到重试队列') ||
            err.message.includes('aborted due to network disconnection') ||
            err.message.includes('网络连接中断'))
        )
      ) {
        error.value = err instanceof Error ? err.message : 'Unknown error occurred'
        console.error('API Error:', err)
      }

      // 确保网络断开时添加到重试队列
      if (
        err instanceof Error &&
        (err.message.includes('网络连接中断') || !navigator.onLine) &&
        !err.message.includes('已添加到重试队列')
      ) {
        console.log('网络错误未添加到队列，手动添加')
        pendingRetryRequests.value.push({ messages, model, settings, onChunk })
      }

      // 只有非网络队列和非网络断开的错误才抛出
      if (
        !(
          err instanceof Error &&
          (err.message.includes('已添加到重试队列') ||
            err.message.includes('aborted due to network disconnection') ||
            err.message.includes('网络连接中断'))
        )
      ) {
        throw err
      }
    } finally {
      console.log(`请求完成清理，时间: ${new Date().toISOString()}`)
      isLoading.value = false
      // 确保从活动控制器集合中移除
      activeControllers.value.delete(controller)
      // 确保清除当前控制器引用
      if (currentController.value === controller) {
        currentController.value = null
      }
      // 确保stopped状态为true
      stopped.value = true
    }
  }

  const stopStreaming = () => {
    stopped.value = true
    // 中止当前控制器
    if (currentController.value) {
      try {
        currentController.value.abort()
        // 从活动控制器集合中移除
        activeControllers.value.delete(currentController.value)
      } catch (e) {
        error.value = null
        console.warn('停止请求失败:', e)
      }
      currentController.value = null
    }
  }

  // 延迟函数
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // 带重试逻辑的通用函数
  const withRetry = async <T>(
    fn: () => Promise<T>,
    isRetryable: (error: any) => boolean = retryConfig.isRetryableError
  ): Promise<T> => {
    let lastError: any = null

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      // 检查是否在线，如果不在线则不进行立即重试，交给handleOnlineStatusChange处理
      if (!navigator.onLine) {
        console.log('网络不在线，跳过立即重试')
        throw new Error('网络连接不可用')
      }

      try {
        // 如果不是第一次尝试，添加延迟（退避策略）
        if (attempt > 0) {
          const delayMs = Math.min(
            retryConfig.baseDelay * Math.pow(2, attempt - 1),
            retryConfig.maxDelay
          )
          console.log(`尝试 ${attempt}/${retryConfig.maxRetries}, 延迟 ${delayMs}ms`)
          await delay(delayMs)

          // 在延迟后再次检查网络状态
          if (!navigator.onLine) {
            console.log('延迟后网络不在线，取消重试')
            throw new Error('网络连接不可用')
          }
        }

        return await fn() // 执行原始函数
      } catch (err) {
        lastError = err

        // 检查是否是AbortError，如果是则不重试（控制器已被中止）
        if (err.name === 'AbortError') {
          console.warn('请求已被中止，不进行重试')
          throw err
        }

        // 检查是否可以重试
        if (!isRetryable(err) || attempt === retryConfig.maxRetries) {
          if (attempt === retryConfig.maxRetries) {
            console.error(`请求失败，已达到最大重试次数 ${retryConfig.maxRetries}`)
          }
          throw err
        }

        // 记录重试信息
        if (retryConfig.isRetryableError(err)) {
          console.warn(`请求失败，准备重试... (尝试 ${attempt + 1}/${retryConfig.maxRetries})`, err)
        }
      }
    }

    // 这一行理论上不会被执行，但为了TypeScript类型检查
    throw lastError
  }

  // 存储需要重试的请求信息
  const pendingRetryRequests = ref<
    Array<{
      messages: Message[]
      model: string
      settings: any
      onChunk: (chunk: string) => void
    }>
  >([])

  // 存储所有进行中的请求控制器
  const activeControllers = ref<Set<AbortController>>(new Set())

  // 网络状态变化处理函数
  const handleOnlineStatusChange = () => {
    const newStatus = navigator.onLine
    const previousStatus = isOnline.value

    console.log(
      `网络状态变化: ${previousStatus ? '在线' : '离线'} -> ${newStatus ? '在线' : '离线'}`
    )

    // 更新网络状态
    isOnline.value = newStatus

    if (!previousStatus && newStatus) {
      // 网络恢复
      console.log('网络连接已恢复，当前时间:', new Date().toISOString())
      // 处理自动重试逻辑
      if (pendingRetryRequests.value.length > 0) {
        console.log(`准备重试 ${pendingRetryRequests.value.length} 个请求`)
        // 重新发送所有待重试的请求
        const requestsToRetry = [...pendingRetryRequests.value]
        pendingRetryRequests.value = []

        // 延迟一小段时间再重试，确保网络完全稳定
        setTimeout(() => {
          // 在实际重试前再次检查网络状态
          if (navigator.onLine) {
            for (const request of requestsToRetry) {
              sendStreamingMessage(
                request.messages,
                request.model,
                request.settings,
                request.onChunk
              )
            }
          } else {
            console.warn('网络状态再次变为离线，取消重试')
            // 重新添加回待重试队列
            pendingRetryRequests.value.push(...requestsToRetry)
          }
        }, 500)
      }
    } else if (previousStatus && !newStatus) {
      // 网络断开
      console.log('网络连接已断开，当前时间:', new Date().toISOString())
      lastOfflineTime.value = new Date()

      // 立即取消所有正在进行的请求
      console.log(`中止所有 ${activeControllers.value.size} 个进行中的请求`)

      // 遍历所有活动控制器并中止
      const controllersToAbort = Array.from(activeControllers.value)
      for (const controller of controllersToAbort) {
        try {
          console.log('中止请求控制器')
          controller.abort()
        } catch (e) {
          console.warn('取消请求失败:', e)
        }
      }

      // 强制清空所有活动控制器
      activeControllers.value.clear()
      currentController.value = null

      // 确保stopped状态为true，防止后续处理继续
      stopped.value = true
    }
  }

  // 主动网络状态轮询函数
  const startNetworkPolling = () => {
    if (isPollingActive.value) return

    isPollingActive.value = true
    console.log('启动网络状态轮询')

    // 创建一个轻量级的ping请求来验证网络连接
    const ping = async () => {
      if (!isPollingActive.value) return

      try {
        // 使用HEAD请求访问一个可靠的资源，减少流量
        const pingUrl = window.location.origin || 'https://www.example.com'
        const response = await fetch(pingUrl, {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(2000), // 2秒超时
        })

        // 更新成功ping时间
        lastSuccessfulPingTime.value = new Date()

        // 如果navigator.onLine显示在线但实际连接失败，这里可以修正
        if (!navigator.onLine && response.ok) {
          console.warn('检测到navigator.onLine状态不准确，实际网络可用')
          // 手动触发网络恢复处理
          isOnline.value = true
          handleOnlineStatusChange()
        }
      } catch (error) {
        // 如果navigator.onLine显示在线但ping失败，可能是网络已断开
        if (navigator.onLine) {
          console.warn('网络状态检测失败，可能已断开连接')
          // 手动触发网络断开处理
          isOnline.value = false
          handleOnlineStatusChange()
        }
      } finally {
        // 继续下一次轮询
        if (isPollingActive.value) {
          setTimeout(ping, 2000) // 2秒轮询一次
        }
      }
    }

    // 开始轮询
    ping()
  }

  // 停止网络状态轮询
  const stopNetworkPolling = () => {
    if (isPollingActive.value) {
      console.log('停止网络状态轮询')
      isPollingActive.value = false
    }
  }

  // 设置网络状态监听器
  onMounted(() => {
    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)

    // 启动主动网络状态轮询
    startNetworkPolling()
  })

  // 清理网络状态监听器
  onUnmounted(() => {
    window.removeEventListener('online', handleOnlineStatusChange)
    window.removeEventListener('offline', handleOnlineStatusChange)

    // 停止网络状态轮询
    stopNetworkPolling()
  })

  return {
    isLoading,
    error,
    isOnline,
    lastOfflineTime,
    lastSuccessfulPingTime,
    isPollingActive,
    sendStreamingMessage,
    stopStreaming,
    startNetworkPolling,
    stopNetworkPolling,
    retryConfig, // 导出重试配置，便于调试和扩展
  }
})
