/**
 * API 工具函数
 * 用于构建和管理 API 请求 URL
 */

/**
 * 获取 shop 域名
 * 从多个来源尝试获取 shop 信息
 *
 * 优先级：
 * 1. 全局变量（window.__REWARDX_SHOP__）
 * 2. 当前 URL hostname（如果包含 .myshopify.com）
 * 3. 从容器元素获取（如果提供了 container）
 *
 * @param container - 可选的容器元素，用于获取 data-shop 属性
 * @returns Shop 域名或 null
 */
export const getShop = (container?: Element | null): string | null => {
  if (typeof window !== "undefined" && window?.Shopify?.shop) {
    return window.Shopify.shop
  }
  // 1. 检查全局变量
  if (typeof window !== "undefined" && (window as any).__REWARDX_SHOP__) {
    return String((window as any).__REWARDX_SHOP__)
  }

  // 2. 从当前 URL hostname 提取
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname.includes(".myshopify.com")) {
      return hostname
    }
  }

  // 3. 从容器元素获取
  if (container) {
    const shopFromData = container.getAttribute("data-shop") ||
                        container.closest("[data-shop]")?.getAttribute("data-shop")
    if (shopFromData) {
      return shopFromData
    }
  }

  return null
}

/**
 * 获取应用 API URL
 * 优先使用 Vite 注入的环境变量，然后回退到其他方式
 *
 * 优先级：
 * 1. Vite 注入的环境变量（import.meta.env.REWARDX_APP_URL）
 * 2. 全局变量（window.__REWARDX_APP_URL__）
 * 3. Vite dev server 代理（:5174 -> :3000）
 * 4. 当前域名（window.location.origin）
 *
 * @returns API 基础 URL（不包含末尾斜杠）
 */
export const getAppApiUrl = (): string => {
  // 1. 优先使用 Vite 注入的环境变量（import.meta.env）
  // @ts-ignore - Vite 会在构建时替换这个值
  const envUrl = import.meta.env.REWARDX_APP_URL || import.meta.env.SHOPIFY_APP_URL || import.meta.env.VITE_REWARDX_APP_URL || import.meta.env.VITE_SHOPIFY_APP_URL

  if (envUrl) {
    // 移除末尾的斜杠，避免双斜杠
    return String(envUrl).replace(/\/+$/, "")
  }

  // 2. 检查全局变量（可能由 Liquid 模板注入）
  if (typeof window !== "undefined" && (window as any).__REWARDX_APP_URL__) {
    return String((window as any).__REWARDX_APP_URL__).replace(/\/+$/, "")
  }

  // 3. 开发环境：如果当前是 Vite dev server (端口 5174)，则使用主服务器 (端口 3000)
  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin
    const currentPort = window.location.port

    // 如果是 Vite dev server (5174)，代理到主服务器 (3000)
    if (currentPort === "5174" || currentOrigin.includes(":5174")) {
      return currentOrigin.replace(":5174", ":3000").replace(/\/+$/, "")
    }
  }

  // 4. 最后回退：使用当前域名（生产环境）
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "")
  }

  // 如果都不存在，返回空字符串（会触发错误）
  return ""
}

/**
 * 构建完整的 API URL
 * 自动添加 shop 等公共参数
 *
 * @param endpoint - API 端点路径（例如："/campaigns/latest" 或 "campaigns/latest"）
 * @param params - 查询参数对象（可选，会自动与公共参数合并）
 * @param container - 可选的容器元素，用于获取 shop 信息
 * @returns 完整的 API URL（例如：https://your-app.com/api/campaigns/latest?shop=xxx）
 * @throws 如果 API 基础 URL 未配置，会抛出错误
 */
export const buildApiUrl = (
  endpoint: string,
  params?: Record<string, string | null | undefined>,
  container?: Element | null
): string => {
  const apiBase = getAppApiUrl()
  if (!apiBase) {
    console.error("❌ RewardX: No API URL configured")
    throw new Error("API URL is not configured")
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint

  let url = `${apiBase}/api/${cleanEndpoint}`

  // 构建查询参数（合并公共参数和自定义参数）
  const searchParams = new URLSearchParams()

  // 1. 添加公共参数（shop 等）
  const shop = getShop(container)
  if (shop) {
    searchParams.append("shop", shop)
  }

  // 2. 添加自定义参数（会覆盖公共参数中的同名参数）
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        searchParams.set(key, String(value)) // 使用 set 以便覆盖公共参数
      }
    })
  }

  // 3. 构建最终 URL
  const queryString = searchParams.toString()
  if (queryString) {
    url += `?${queryString}`
  }

  return url
}

/**
 * 执行 API 请求（带错误处理）
 * 自动添加 shop 等公共参数
 *
 * @param endpoint - API 端点路径
 * @param options - Fetch 选项
 * @param container - 可选的容器元素，用于获取 shop 信息
 * @returns Promise<Response>
 */
export const fetchApi = async (
  endpoint: string,
  options: RequestInit = {},
  container?: Element | null
): Promise<Response> => {
  // 从 endpoint 中提取查询参数（如果已包含）
  const [path, existingQuery] = endpoint.split("?")
  const existingParams = existingQuery ? Object.fromEntries(new URLSearchParams(existingQuery)) : {}
  
  const apiUrl = buildApiUrl(path, existingParams, container)

  const defaultOptions: RequestInit = {
    credentials: "include", // 支持 CORS
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  }

  const response = await fetch(apiUrl, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  })

  return response
}

/**
 * 执行 API 请求并解析 JSON 响应
 * 自动添加 shop 等公共参数
 *
 * @param endpoint - API 端点路径
 * @param options - Fetch 选项
 * @param container - 可选的容器元素，用于获取 shop 信息
 * @returns Promise<T> - 解析后的 JSON 数据
 * @throws 如果响应不成功，会抛出包含错误信息的 Error
 */
export const fetchApiJson = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  container?: Element | null
): Promise<T> => {
  try {
    const response = await fetchApi(endpoint, options, container)

    // 先尝试解析 JSON（即使状态码不是 200，也可能返回 JSON 格式的错误信息）
    let data: any
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : {}
    } catch (e) {
      // 如果解析失败，使用空对象
      data = {}
    }

    // 如果响应不成功，抛出错误
    if (!response.ok) {
      const errorMessage = data.error || data.message || data.reason || `HTTP ${response.status}: ${response.statusText}`
      const error = new Error(errorMessage) as any
      error.status = response.status
      error.data = data
      throw error
    }

    return data as T
  } catch (error: any) {
    // 如果是网络错误或其他错误，直接抛出
    if (error.status) {
      // 这是 HTTP 错误，已经处理过
      throw error
    }
    // 网络错误或其他错误，包装后抛出
    throw new Error(error.message || "Network error")
  }
}

