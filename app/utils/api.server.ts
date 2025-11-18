/**
 * 服务端 API 工具
 * 提供通用的请求处理、错误处理、响应格式化等功能
 */

import type { User } from "@prisma/client"
import prisma from "@/db.server"

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
 */
export const apiHandler = async <T = unknown>(
  handler: () => Promise<T>
): Promise<Response> => {
  try {
    const result = await handler()
    return ok(result)
  } catch (error) {
    // 自定义错误码处理
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return notFound("User")
      }
      if (error.message === "CAMPAIGN_NOT_FOUND") {
        return notFound("Campaign")
      }
      if (error.message.startsWith("VALIDATION_")) {
        return badRequest(error.message.replace("VALIDATION_", ""))
      }
    }
    return serverError(error)
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

