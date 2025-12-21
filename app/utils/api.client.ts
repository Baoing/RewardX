/**
 * 前端 API 请求工具
 * 统一封装 fetch 请求，提供标准的错误处理和响应格式
 */

// ============ 类型定义 ============

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
  timeout?: number
}

interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
}

// ============ 默认配置 ============

const DEFAULT_TIMEOUT = 30000 // 30秒
const DEFAULT_HEADERS = {
  "Content-Type": "application/json"
}

// ============ 错误类 ============

export class ApiError extends Error {
  status: number
  statusText: string
  response?: ApiResponse

  constructor(message: string, status: number, statusText: string, response?: ApiResponse) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.statusText = statusText
    this.response = response
  }
}

// ============ 工具函数 ============

/**
 * 构建 URL 查询参数
 */
const buildQueryString = (params: Record<string, string | number | boolean>): string => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value))
  })
  return searchParams.toString()
}

/**
 * 超时控制
 */
const createTimeoutSignal = (timeout: number): AbortSignal => {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeout)
  return controller.signal
}

/**
 * 解析响应
 */
const parseResponse = async <T = unknown>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get("content-type")
  
  // 处理空响应
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {
      success: response.ok,
      data: undefined as T
    }
  }

  // 解析 JSON
  if (contentType?.includes("application/json")) {
    const data = await response.json()
    return data
  }

  // 解析文本
  const text = await response.text()
  return {
    success: response.ok,
    data: text as T
  }
}

// ============ API Client 类 ============

class ApiClient {
  private config: ApiClientConfig

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || "",
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: { ...DEFAULT_HEADERS, ...config.headers }
    }
  }

  /**
   * 通用请求方法
   */
  private async request<T = unknown>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    try {
      // 构建完整 URL
      let fullURL = this.config.baseURL + url

      // 添加查询参数
      if (options.params) {
        const queryString = buildQueryString(options.params)
        fullURL += `?${queryString}`
        delete options.params
      }

      // 注意：认证已在组件层面通过 useAuthenticatedFetch 处理
      // 这里不再需要获取 idToken，因为请求已经包含了认证头

      // 合并 headers
      const headers = {
        ...this.config.headers,
        ...options.headers
      }

      // 设置超时
      const timeout = options.timeout || this.config.timeout || DEFAULT_TIMEOUT
      const signal = options.signal || createTimeoutSignal(timeout)

      console.log(`🔍 API Request: ${options.method || "GET"} ${fullURL}`)

      // 发起请求
      const response = await fetch(fullURL, {
        ...options,
        headers,
        signal,
        credentials: "include" // 🔑 确保携带 cookies（用于 Shopify session）
      })

      // 解析响应
      const result = await parseResponse<T>(response)

      // 处理错误响应
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`, result)
        throw new ApiError(
          result.error || result.message || `Request failed with status ${response.status}`,
          response.status,
          response.statusText,
          result
        )
      }

      console.log(`✅ API Success: ${options.method || "GET"} ${fullURL}`)

      // 返回数据
      // 如果响应格式是 { success: true, data: ... }，则返回 data
      // 否则返回整个响应
      if (result.success && result.data !== undefined) {
        return result.data as T
      }

      return result as T

    } catch (error) {
      // 处理网络错误
      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.error("❌ API Timeout:", url)
          throw new ApiError("Request timeout", 408, "Timeout")
        }

        console.error("❌ API Network Error:", error.message)
        throw new ApiError(error.message, 0, "Network Error")
      }

      throw new ApiError("Unknown error", 0, "Unknown")
    }
  }

  /**
   * GET 请求
   */
  async get<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "GET"
    })
  }

  /**
   * POST 请求
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    // FormData 不需要 JSON.stringify，也不需要 Content-Type header（浏览器自动设置）
    const body = data instanceof FormData
      ? data
      : data ? JSON.stringify(data) : undefined

    const headers = data instanceof FormData
      ? options.headers // FormData 时只使用 options 中的 headers（如 Authorization）
      : undefined // 非 FormData 使用默认合并逻辑

    return this.request<T>(url, {
      ...options,
      method: "POST",
      headers,
      body
    })
  }

  /**
   * PUT 请求
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * PATCH 请求
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "DELETE"
    })
  }
}

// ============ 导出实例 ============

/**
 * 获取 App Bridge idToken（如果可用）
 * 注意：此函数不再使用，因为认证已改为在前端通过 useAuthenticatedFetch 处理
 */
async function getIdToken(): Promise<string | null> {
  // 不再尝试获取 idToken，因为认证已在 fetch 层面处理
  return null
}

/**
 * 默认 API 客户端实例
 */
export const api = new ApiClient()

/**
 * 创建带认证的 API 客户端
 * @param getIdTokenFn 获取 idToken 的函数
 */
export const createAuthenticatedApiClient = (getIdTokenFn: () => Promise<string | null>) => {
  return new ApiClient({
    headers: async () => {
      const token = await getIdTokenFn()
      return token ? { Authorization: `Bearer ${token}` } : {}
    }
  })
}

/**
 * 创建自定义配置的 API 客户端
 */
export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config)
}

// ============ 类型导出 ============

export type { ApiResponse, RequestOptions, ApiClientConfig }

