/**
 * 服务端 API 工具
 * 提供通用的请求处理、错误处理、响应格式化等功能
 */

import type { User } from "@prisma/client"
import prisma from "@/db.server"
import { isAllowedAllOrigins } from "@/config/cors"

// ============ CORS 支持 ============

/**
 * 获取允许的 CORS 源
 * 允许所有 Shopify Storefront 域名
 */
const getAllowedOrigins = (): string[] => {
  // 允许所有 .myshopify.com 域名
  return [
    /^https:\/\/.*\.myshopify\.com$/,
    /^https:\/\/.*\.myshopify\.io$/, // 开发环境
  ]
}

/**
 * 检查请求来源是否允许
 */
const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false
  
  const allowedPatterns = getAllowedOrigins()
  return allowedPatterns.some(pattern => pattern.test(origin))
}

/**
 * 添加 CORS 头到响应
 * 
 * @param response - 响应对象
 * @param request - 请求对象
 * @param allowAllOrigins - 是否强制允许所有来源（可选，如果不提供则根据路径自动判断）
 */
export const addCorsHeaders = (response: Response, request: Request, allowAllOrigins?: boolean): Response => {
  const origin = request.headers.get("Origin")
  const url = new URL(request.url)
  const path = url.pathname
  
  // 如果没有明确指定，根据路径自动判断
  const shouldAllowAll = allowAllOrigins !== undefined 
    ? allowAllOrigins 
    : isAllowedAllOrigins(path)
  
  // 如果允许所有来源
  if (shouldAllowAll) {
    const headers = new Headers(response.headers)
    
    // 重要：如果请求包含 credentials，不能使用 *，必须使用具体的 Origin
    // 如果请求没有 Origin 或不需要 credentials，可以使用 *
    if (origin) {
      // 有 Origin 时，使用具体的 Origin（即使允许所有来源）
      headers.set("Access-Control-Allow-Origin", origin)
      headers.set("Access-Control-Allow-Credentials", "true")
    } else {
      // 没有 Origin 时，使用 *（但此时不能使用 credentials）
      headers.set("Access-Control-Allow-Origin", "*")
    }
    
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
    headers.set("Access-Control-Max-Age", "86400") // 24 小时
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  }
  
  // 如果来源被允许，添加 CORS 头
  if (origin && isOriginAllowed(origin)) {
    const headers = new Headers(response.headers)
    headers.set("Access-Control-Allow-Origin", origin)
    headers.set("Access-Control-Allow-Credentials", "true")
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
    headers.set("Access-Control-Max-Age", "86400") // 24 小时
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  }
  
  return response
}

/**
 * 处理 OPTIONS 预检请求
 * 
 * @param request - 请求对象
 * @param allowAllOrigins - 是否强制允许所有来源（可选，如果不提供则根据路径自动判断）
 */
export const handleCorsPreflight = (request: Request, allowAllOrigins?: boolean): Response | null => {
  if (request.method === "OPTIONS") {
    const url = new URL(request.url)
    const path = url.pathname
    const origin = request.headers.get("Origin")
    
    // 如果没有明确指定，根据路径自动判断
    const shouldAllowAll = allowAllOrigins !== undefined 
      ? allowAllOrigins 
      : isAllowedAllOrigins(path)
    
    // 如果允许所有来源
    if (shouldAllowAll) {
      const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400"
      }
      
      // 重要：如果请求包含 Origin，必须使用具体的 Origin，不能使用 *
      // 因为预检请求通常包含 Origin，所以优先使用 Origin
      if (origin) {
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
      } else {
        headers["Access-Control-Allow-Origin"] = "*"
      }
      
      return new Response(null, {
        status: 204,
        headers
      })
    }
  
    // 如果来源被允许，添加 CORS 头
    if (origin && isOriginAllowed(origin)) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400"
        }
      })
    }
    
    return new Response(null, { status: 204 })
  }
  
  return null
}

/**
 * 创建带 CORS 头的 JSON 响应
 * 
 * @param data - 响应数据
 * @param init - 响应初始化选项
 * @param request - 请求对象
 * @param allowAllOrigins - 是否强制允许所有来源（可选，如果不提供则根据路径自动判断）
 */
export const jsonWithCors = (data: unknown, init?: ResponseInit, request?: Request, allowAllOrigins?: boolean): Response => {
  const response = Response.json(data, init)
  return request ? addCorsHeaders(response, request, allowAllOrigins) : response
}

// ============ 错误响应 ============

interface ApiError {
  error: string
  code?: string
  details?: unknown
}

/**
 * 创建错误响应
 */
export const errorResponse = (
  error: string,
  status: number = 400,
  code?: string,
  details?: unknown
): Response => {
  const body: ApiError = { error }
  if (code) body.code = code
  if (details) body.details = details

  return Response.json(body, { status })
}

/**
 * 400 Bad Request
 */
export const badRequest = (error: string, details?: unknown): Response => {
  return errorResponse(error, 400, "BAD_REQUEST", details)
}

/**
 * 401 Unauthorized
 */
export const unauthorized = (error: string = "Unauthorized"): Response => {
  return errorResponse(error, 401, "UNAUTHORIZED")
}

/**
 * 403 Forbidden
 */
export const forbidden = (error: string = "Forbidden"): Response => {
  return errorResponse(error, 403, "FORBIDDEN")
}

/**
 * 404 Not Found
 */
export const notFound = (resource: string = "Resource"): Response => {
  return errorResponse(`${resource} not found`, 404, "NOT_FOUND")
}

/**
 * 500 Internal Server Error
 */
export const serverError = (error: unknown): Response => {
  console.error("❌ Server error:", error)
  const message = error instanceof Error ? error.message : "Internal server error"
  return errorResponse(message, 500, "SERVER_ERROR")
}

// ============ 成功响应 ============

/**
 * 200 OK - 返回数据
 */
export const ok = <T = unknown>(data: T): Response => {
  return Response.json(data)
}

/**
 * 201 Created - 创建成功
 */
export const created = <T = unknown>(data: T): Response => {
  return Response.json(data, { status: 201 })
}

/**
 * 204 No Content - 成功但无返回内容
 */
export const noContent = (): Response => {
  return new Response(null, { status: 204 })
}

// ============ 用户相关 ============

/**
 * 根据 shop 获取用户
 */
export const getUserByShop = async (shop: string): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: { shop }
  })

  if (!user) {
    throw new Error("USER_NOT_FOUND")
  }

  return user
}

/**
 * 验证用户并返回
 */
export const requireUser = async (shop: string): Promise<User | Response> => {
  try {
    return await getUserByShop(shop)
  } catch (error) {
    return notFound("User")
  }
}

// ============ 请求处理包装器 ============

/**
 * 统一的 API 处理器包装
 * 自动处理错误并返回标准响应
 * 支持 CORS
 */
export const apiHandler = async <T = unknown>(
  handler: () => Promise<T>,
  request?: Request
): Promise<Response> => {
  // 处理 OPTIONS 预检请求
  if (request) {
    const preflightResponse = handleCorsPreflight(request)
    if (preflightResponse) {
      return preflightResponse
    }
  }

  try {
    const result = await handler()
    const response = ok(result)
    
    // 添加 CORS 头（自动根据路径判断是否允许所有来源）
    if (request) {
      return addCorsHeaders(response, request)
    }
    
    return response
  } catch (error) {
    // 自定义错误码处理
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        const response = notFound("User")
        return request ? addCorsHeaders(response, request) : response
      }
      if (error.message === "CAMPAIGN_NOT_FOUND") {
        const response = notFound("Campaign")
        return request ? addCorsHeaders(response, request) : response
      }
      if (error.message.startsWith("VALIDATION_")) {
        const response = badRequest(error.message.replace("VALIDATION_", ""))
        return request ? addCorsHeaders(response, request) : response
      }
    }
    const response = serverError(error)
    return request ? addCorsHeaders(response, request) : response
  }
}

/**
 * 统一的 Action 处理器包装
 * 用于需要返回不同响应类型的场景
 */
export const actionHandler = async (
  handler: () => Promise<Response>
): Promise<Response> => {
  try {
    return await handler()
  } catch (error) {
    return serverError(error)
  }
}

// ============ 分页工具 ============

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 创建分页响应
 */
export const paginate = <T = unknown>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 20
): PaginatedResponse<T> => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * 从 URL 获取分页参数
 */
export const getPaginationParams = (url: URL): PaginationParams => {
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit))
  }
}

// ============ 查询参数工具 ============

/**
 * 从 URL 获取字符串参数
 */
export const getStringParam = (url: URL, key: string): string | null => {
  return url.searchParams.get(key)
}

/**
 * 从 URL 获取布尔参数
 */
export const getBooleanParam = (url: URL, key: string, defaultValue: boolean = false): boolean => {
  const value = url.searchParams.get(key)
  if (value === null) return defaultValue
  return value === "true" || value === "1"
}

/**
 * 从 URL 获取数字参数
 */
export const getNumberParam = (url: URL, key: string): number | null => {
  const value = url.searchParams.get(key)
  if (value === null) return null
  const num = parseInt(value)
  return isNaN(num) ? null : num
}

