/**
 * 管理员 API 工具
 * 用于调用需要 ADMIN_SECRET 认证的管理员接口
 */

import { createApiClient } from "./api.client"

// ============ 类型定义 ============

export interface Discount {
  id: string
  code: string
  type: "percentage" | "fixed" | "trial_extension"
  value: number
  applicablePlans?: string
  billingCycles?: string
  maxUses?: number
  currentUses: number
  maxUsesPerUser?: number
  startsAt?: string
  expiresAt?: string
  isActive: boolean
  description?: string
  internalNotes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateDiscountRequest {
  code: string
  type: "percentage" | "fixed" | "trial_extension"
  value: number
  applicablePlans?: string[]
  billingCycles?: string[]
  maxUses?: number
  maxUsesPerUser?: number
  startsAt?: Date
  expiresAt?: Date
  description?: string
  internalNotes?: string
}

export interface DiscountStats {
  discount: Discount
  totalUses: number
  totalRevenue: number
  users: Array<{
    userId: string
    shop: string
    usedCount: number
  }>
}

// ============ 创建管理员 API 客户端 ============

/**
 * 获取管理员 API 客户端
 * 自动添加 ADMIN_SECRET 认证头
 */
export const getAdminApiClient = () => {
  const adminSecret = typeof window !== "undefined"
    ? localStorage.getItem("admin_secret")
    : process.env.ADMIN_SECRET

  if (!adminSecret) {
    console.warn("⚠️ ADMIN_SECRET not found. Admin API calls will fail.")
  }

  return createApiClient({
    headers: {
      "Authorization": `Bearer ${adminSecret}`
    }
  })
}

// 创建管理员 API 实例
const adminApi = getAdminApiClient()

// ============ Discount API 方法 ============

/**
 * 获取所有折扣码
 */
export const getDiscounts = async (includeInactive = false): Promise<Discount[]> => {
  const result = await adminApi.get<{ discounts: Discount[] }>("/api/admin/discounts", {
    params: { includeInactive }
  })
  return result.discounts
}

/**
 * 获取单个折扣码的统计信息
 */
export const getDiscountStats = async (discountId: string): Promise<DiscountStats> => {
  return adminApi.get<DiscountStats>("/api/admin/discounts", {
    params: { id: discountId }
  })
}

/**
 * 创建折扣码
 */
export const createDiscount = async (data: CreateDiscountRequest): Promise<Discount> => {
  const formData = new FormData()
  formData.append("action", "create")
  formData.append("code", data.code)
  formData.append("type", data.type)
  formData.append("value", data.value.toString())

  if (data.description) formData.append("description", data.description)
  if (data.internalNotes) formData.append("internalNotes", data.internalNotes)
  if (data.applicablePlans) formData.append("applicablePlans", JSON.stringify(data.applicablePlans))
  if (data.billingCycles) formData.append("billingCycles", JSON.stringify(data.billingCycles))
  if (data.maxUses) formData.append("maxUses", data.maxUses.toString())
  if (data.maxUsesPerUser) formData.append("maxUsesPerUser", data.maxUsesPerUser.toString())
  if (data.startsAt) formData.append("startsAt", data.startsAt.toISOString())
  if (data.expiresAt) formData.append("expiresAt", data.expiresAt.toISOString())

  const result = await adminApi.post<{ discount: Discount }>("/api/admin/discounts", formData)
  return result.discount
}

/**
 * 批量创建折扣码
 */
export const createBulkDiscounts = async (params: {
  prefix: string
  count: number
  type: "percentage" | "fixed" | "trial_extension"
  value: number
  maxUsesPerUser?: number
  expiresAt?: Date
}): Promise<Discount[]> => {
  const formData = new FormData()
  formData.append("action", "createBulk")
  formData.append("prefix", params.prefix)
  formData.append("count", params.count.toString())
  formData.append("type", params.type)
  formData.append("value", params.value.toString())

  if (params.maxUsesPerUser) {
    formData.append("maxUsesPerUser", params.maxUsesPerUser.toString())
  }
  if (params.expiresAt) {
    formData.append("expiresAt", params.expiresAt.toISOString())
  }

  const result = await adminApi.post<{ discounts: Discount[] }>("/api/admin/discounts", formData)
  return result.discounts
}

/**
 * 更新折扣码
 */
export const updateDiscount = async (
  discountId: string,
  updates: {
    isActive?: boolean
    description?: string
    maxUses?: number
    expiresAt?: Date
  }
): Promise<Discount> => {
  const formData = new FormData()
  formData.append("action", "update")
  formData.append("discountId", discountId)

  if (updates.isActive !== undefined) {
    formData.append("isActive", updates.isActive.toString())
  }
  if (updates.description !== undefined) {
    formData.append("description", updates.description)
  }
  if (updates.maxUses !== undefined) {
    formData.append("maxUses", updates.maxUses.toString())
  }
  if (updates.expiresAt !== undefined) {
    formData.append("expiresAt", updates.expiresAt.toISOString())
  }

  const result = await adminApi.post<{ discount: Discount }>("/api/admin/discounts", formData)
  return result.discount
}

/**
 * 停用折扣码
 */
export const deactivateDiscount = async (discountId: string): Promise<Discount> => {
  const formData = new FormData()
  formData.append("action", "deactivate")
  formData.append("discountId", discountId)

  const result = await adminApi.post<{ discount: Discount }>("/api/admin/discounts", formData)
  return result.discount
}

// ============ Subscription API 方法 ============

// TODO: 添加管理员订阅管理相关方法
// 可以参考 api.admin.subscriptions.ts 实现

/**
 * 设置管理员密钥（用于客户端）
 * 注意：这应该只在安全的管理员界面中使用
 */
export const setAdminSecret = (secret: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_secret", secret)
  }
}

/**
 * 清除管理员密钥
 */
export const clearAdminSecret = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_secret")
  }
}

