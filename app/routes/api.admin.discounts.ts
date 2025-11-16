/**
 * 管理员 API - 折扣管理
 * POST /api/admin/discounts - 创建折扣码
 * GET /api/admin/discounts - 获取折扣码列表
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import {
  createDiscount,
  updateDiscount,
  deactivateDiscount,
  getAllDiscounts,
  getDiscountStats,
  createBulkDiscounts
} from "../services/discount.server"

// 简单的管理员验证
const ADMIN_SECRET = process.env.ADMIN_SECRET || "your-admin-secret"

function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    throw new Response("Unauthorized", { status: 401 })
  }
}

/**
 * POST - 创建/更新/停用折扣码
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  verifyAdmin(request)

  try {
    const formData = await request.formData()
    const action = formData.get("action") as string

    // 创建折扣码
    if (action === "create") {
      const code = formData.get("code") as string
      const type = formData.get("type") as "percentage" | "fixed" | "trial_extension"
      const value = parseFloat(formData.get("value") as string)
      const description = formData.get("description") as string
      const internalNotes = formData.get("internalNotes") as string
      
      const applicablePlansRaw = formData.get("applicablePlans")
      const applicablePlans = applicablePlansRaw ? JSON.parse(applicablePlansRaw as string) : undefined
      
      const billingCyclesRaw = formData.get("billingCycles")
      const billingCycles = billingCyclesRaw ? JSON.parse(billingCyclesRaw as string) : undefined
      
      const maxUses = formData.get("maxUses") ? parseInt(formData.get("maxUses") as string) : undefined
      const maxUsesPerUser = formData.get("maxUsesPerUser") ? parseInt(formData.get("maxUsesPerUser") as string) : undefined
      
      const startsAt = formData.get("startsAt") ? new Date(formData.get("startsAt") as string) : undefined
      const expiresAt = formData.get("expiresAt") ? new Date(formData.get("expiresAt") as string) : undefined

      const discount = await createDiscount({
        code,
        type,
        value,
        applicablePlans,
        billingCycles,
        maxUses,
        maxUsesPerUser,
        startsAt,
        expiresAt,
        description,
        internalNotes
      })

      return Response.json({
        success: true,
        discount
      })
    }

    // 批量创建折扣码
    if (action === "createBulk") {
      const prefix = formData.get("prefix") as string
      const count = parseInt(formData.get("count") as string)
      const type = formData.get("type") as "percentage" | "fixed" | "trial_extension"
      const value = parseFloat(formData.get("value") as string)
      const maxUsesPerUser = formData.get("maxUsesPerUser") ? parseInt(formData.get("maxUsesPerUser") as string) : 1
      const expiresAt = formData.get("expiresAt") ? new Date(formData.get("expiresAt") as string) : undefined

      const discounts = await createBulkDiscounts(prefix, count, {
        type,
        value,
        maxUsesPerUser,
        expiresAt
      })

      return Response.json({
        success: true,
        discounts,
        count: discounts.length
      })
    }

    // 更新折扣码
    if (action === "update") {
      const discountId = formData.get("discountId") as string
      const updates: any = {}
      
      if (formData.has("isActive")) updates.isActive = formData.get("isActive") === "true"
      if (formData.has("description")) updates.description = formData.get("description")
      if (formData.has("maxUses")) updates.maxUses = parseInt(formData.get("maxUses") as string)
      if (formData.has("expiresAt")) updates.expiresAt = new Date(formData.get("expiresAt") as string)

      const discount = await updateDiscount(discountId, updates)

      return Response.json({
        success: true,
        discount
      })
    }

    // 停用折扣码
    if (action === "deactivate") {
      const discountId = formData.get("discountId") as string
      const discount = await deactivateDiscount(discountId)

      return Response.json({
        success: true,
        discount
      })
    }

    return Response.json({
      success: false,
      error: "Invalid action"
    }, { status: 400 })
  } catch (error) {
    console.error("❌ Admin Discount API error:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * GET - 获取折扣码列表或统计
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  verifyAdmin(request)

  try {
    const url = new URL(request.url)
    const discountId = url.searchParams.get("id")
    const includeInactive = url.searchParams.get("includeInactive") === "true"

    // 获取单个折扣码的统计
    if (discountId) {
      const stats = await getDiscountStats(discountId)
      return Response.json(stats)
    }

    // 获取所有折扣码
    const discounts = await getAllDiscounts(includeInactive)

    return Response.json({
      discounts,
      total: discounts.length
    })
  } catch (error) {
    console.error("❌ Admin Discount API error:", error)
    return Response.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


