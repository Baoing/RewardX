/**
 * 订阅系统使用示例
 * 展示如何在实际功能中集成订阅系统
 */

import { checkQuota, consumeQuota } from "../services/subscription.server"
import { prisma } from "../db.server"

/**
 * 示例 1: 优化 Meta 标签功能（需要消耗配额）
 */
export async function optimizeProductMeta(
  userId: string,
  productId: string,
  newMeta: { title: string; description: string }
) {
  // 1. 检查配额
  const { hasQuota, remaining } = await checkQuota(userId)
  
  if (!hasQuota) {
    return {
      success: false,
      error: "配额不足，请升级套餐或等待下月重置",
      remaining: 0
    }
  }

  try {
    // 2. 执行业务逻辑（优化 Meta 标签）
    console.log(`优化产品 ${productId} 的 Meta 标签...`)
    // 实际的优化逻辑...
    
    // 3. 消耗配额
    const consumed = await consumeQuota(
      userId,
      "optimize_meta",
      1,
      { productId, action: "meta_optimization" }
    )

    if (!consumed) {
      return {
        success: false,
        error: "配额消耗失败",
        remaining: remaining - 1
      }
    }

    return {
      success: true,
      message: "Meta 标签优化成功",
      remaining: remaining - 1
    }
  } catch (error) {
    console.error("优化失败:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * 示例 2: 批量优化（检查是否有足够配额）
 */
export async function bulkOptimizeProducts(
  userId: string,
  productIds: string[]
) {
  // 1. 检查是否有足够配额
  const { hasQuota, remaining } = await checkQuota(userId)
  
  if (!hasQuota || remaining < productIds.length) {
    return {
      success: false,
      error: `配额不足。需要 ${productIds.length} 个配额，剩余 ${remaining} 个`,
      remaining
    }
  }

  const results = []

  for (const productId of productIds) {
    try {
      // 执行优化
      console.log(`优化产品 ${productId}...`)
      
      // 消耗配额
      await consumeQuota(userId, "bulk_optimize", 1, { productId })
      
      results.push({
        productId,
        success: true
      })
    } catch (error) {
      results.push({
        productId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  return {
    success: true,
    results,
    totalProcessed: results.filter(r => r.success).length
  }
}

/**
 * 示例 3: 功能权限检查（不同套餐有不同功能）
 */
export async function checkFeatureAccess(
  userId: string,
  feature: "ai_suggestions" | "bulk_tools" | "advanced_schema" | "api_access"
): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active"
    }
  })

  if (!subscription) {
    return false
  }

  // 功能权限映射
  const featurePermissions = {
    free: [],
    starter: ["auto_meta", "structured_data", "image_alt"],
    professional: ["auto_meta", "structured_data", "image_alt", "ai_suggestions", "bulk_tools", "advanced_schema"],
    enterprise: ["auto_meta", "structured_data", "image_alt", "ai_suggestions", "bulk_tools", "advanced_schema", "api_access", "custom_integration"]
  }

  const allowedFeatures = featurePermissions[subscription.planType as keyof typeof featurePermissions] || []
  
  return allowedFeatures.includes(feature)
}

/**
 * 示例 4: 在 API 路由中使用
 */
export async function exampleApiRoute(request: Request, userId: string) {
  // 检查功能权限
  const hasAiAccess = await checkFeatureAccess(userId, "ai_suggestions")
  
  if (!hasAiAccess) {
    return Response.json({
      success: false,
      error: "此功能需要 Professional 或 Enterprise 套餐"
    }, { status: 403 })
  }

  // 检查配额
  const { hasQuota, remaining } = await checkQuota(userId)
  
  if (!hasQuota) {
    return Response.json({
      success: false,
      error: "配额不足，请升级套餐",
      remaining
    }, { status: 429 }) // 429 Too Many Requests
  }

  // 执行业务逻辑...
  const result = await performAiOptimization(userId)

  // 消耗配额
  await consumeQuota(userId, "ai_optimization", 1)

  return Response.json({
    success: true,
    result,
    remaining: remaining - 1
  })
}

async function performAiOptimization(userId: string) {
  // AI 优化逻辑...
  return { optimized: true }
}

/**
 * 示例 5: 配额不足时的用户提示组件数据
 */
export async function getQuotaStatusForUI(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active"
    }
  })

  if (!subscription) {
    return {
      planType: "free",
      quotaLimit: 0,
      quotaUsed: 0,
      quotaRemaining: 0,
      resetAt: new Date(),
      status: "no_subscription"
    }
  }

  const remaining = Math.max(0, subscription.quotaLimit - subscription.quotaUsed)
  const usagePercentage = subscription.quotaLimit > 0
    ? (subscription.quotaUsed / subscription.quotaLimit * 100)
    : 0

  return {
    planType: subscription.planType,
    quotaLimit: subscription.quotaLimit,
    quotaUsed: subscription.quotaUsed,
    quotaRemaining: remaining,
    usagePercentage: Math.round(usagePercentage),
    resetAt: subscription.quotaResetAt,
    status: remaining === 0 ? "exhausted" : usagePercentage > 90 ? "warning" : "normal"
  }
}


