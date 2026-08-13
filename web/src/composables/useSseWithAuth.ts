import { useAuthStore } from '@/stores/auth'

/**
 * 创建带 Authorization header 的 SSE 连接。
 * 浏览器原生 EventSource 不支持自定义 header，此函数用 fetch + ReadableStream 替代。
 * 当 token 更改/过期时，由调用方重新连接。
 */
export function createAuthEventSource(
  url: string,
  onMessage: (data: unknown) => void,
  onError?: (err: unknown) => void,
): { close: () => void } {
  const authStore = useAuthStore()
  const controller = new AbortController()

  async function connect() {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        onError?.(new Error(`SSE connection failed: ${response.status}`))
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        onError?.(new Error('SSE: Response body not readable'))
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE format: "data: {...}\n\n"
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const dataMatch = line.match(/^data: (.+)$/m)
          if (dataMatch) {
            try {
              const parsed = JSON.parse(dataMatch[1])
              onMessage(parsed)
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 正常关闭
        return
      }
      onError?.(err)
    }
  }

  connect()

  return {
    close: () => controller.abort(),
  }
}
