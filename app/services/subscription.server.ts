/**
 * 订阅服务
 * 处理订阅创建、更新、取消等核心业务逻辑
 */

import prisma from "../db.server"
import { PlanType, BillingCycle, SubscriptionStatus, getPlanConfig, getPlanPrice } from "../config/plans"

export interface CreateSubscriptionParams {
  userId: string
  planType: PlanType
  billingCycle: BillingCycle
  shopifyChargeId?: string
  shopifyConfirmUrl?: string
  discountCode?: string
  isManualGrant?: boolean
  grantedBy?: string
  grantReason?: string
}

/**
 * 创建订阅
 */
export async function createSubscription(params: CreateSubscriptionParams) {
  const {
    userId,
    planType,
    billingCycle,
    shopifyChargeId,
    shopifyConfirmUrl,
    discountCode,
    isManualGrant = false,
    grantedBy,
    grantReason
  } = params

  // 1. 获取套餐配置
  const planConfig = getPlanConfig(planType)
  const price = getPlanPrice(planType, billingCycle)
  
  // 2. 计算价格（考虑折扣）
  let finalPrice = price
  let discountAmount = 0
  let discount = null
  
  if (discountCode) {
    discount = await validateAndApplyDiscount(
      userId,
      discountCode,
      planType,
      billingCycle,
      price
    )
    
    if (discount) {
      discountAmount = discount.discountAmount
      finalPrice = Math.max(0, price - discountAmount)
    }
  }

  // 3. 计算订阅周期
  const now = new Date()
  const periodEnd = new Date(now)
  if (billingCycle === BillingCycle.MONTHLY) {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  }

  // 4. 计算试用期
  const trialDays = planConfig.trialDays
  const isTrial = trialDays > 0 && !isManualGrant
  const trialEndAt = isTrial ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null

  // 5. 取消旧订阅（如果有）
  await cancelActiveSubscriptions(userId)

  // 6. 创建新订阅
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      shopifyChargeId,
      shopifyConfirmUrl,
      planType,
      billingCycle,
      price: finalPrice,
      originalPrice: price,
      quotaLimit: planConfig.quota,
      quotaUsed: 0,
      quotaResetAt: periodEnd,
      status: shopifyChargeId ? SubscriptionStatus.PENDING : (isManualGrant ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING),
      isTrial,
      trialDays,
      trialStartAt: isTrial ? now : null,
      trialEndAt,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      discountId: discount?.id,
      discountAmount,
      discountType: discount?.type,
      isManualGrant,
      grantedBy,
      grantReason,
      grantExpiresAt: isManualGrant && grantReason ? periodEnd : null
    },
    include: {
      user: true,
      discount: true
    }
  })

  // 7. 记录使用折扣
  if (discount) {
    await recordDiscountUsage(userId, discount.id)
  }

  // 8. 记录分析事件
  await recordAnalyticsEvent({
    userId,
    eventType: "subscription_created",
    eventData: JSON.stringify({
      planType,
      billingCycle,
      price: finalPrice,
      isTrial,
      isManualGrant
    })
  })

  return subscription
}

/**
 * 激活订阅（Shopify 回调后）
 */
export async function activateSubscription(subscriptionId: string, shopifyData?: any) {
  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      metadata: shopifyData ? JSON.stringify(shopifyData) : undefined
    },
    include: {
      user: true
    }
  })

  // 更新用户状态
  await prisma.user.update({
    where: { id: subscription.userId },
    data: {
      isTrial: subscription.isTrial,
      trialEndsAt: subscription.trialEndAt
    }
  })

  // 记录分析事件
  await recordAnalyticsEvent({
    userId: subscription.userId,
    eventType: "subscription_activated",
    eventData: JSON.stringify({
      planType: subscription.planType,
      billingCycle: subscription.billingCycle
    })
  })

  return subscription
}

/**
 * 取消订阅
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelImmediately: boolean = false,
  reason?: string
) {
  const now = new Date()
  
  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: cancelImmediately ? SubscriptionStatus.CANCELLED : SubscriptionStatus.ACTIVE,
      cancelAt: cancelImmediately ? now : undefined,
      cancelledAt: cancelImmediately ? now : undefined,
      metadata: reason ? JSON.stringify({ cancelReason: reason }) : undefined
    }
  })

  // 记录分析事件
  await recordAnalyticsEvent({
    userId: subscription.userId,
    eventType: "subscription_cancelled",
    eventData: JSON.stringify({
      planType: subscription.planType,
      cancelImmediately,
      reason
    })
  })

  return subscription
}

/**
 * 获取当前活跃订阅
 */
export async function getCurrentSubscription(userId: string) {
  return await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING]
      }
    },
    include: {
      Discount: true
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

/**
 * 检查配额
 */
export async function checkQuota(userId: string): Promise<{
  hasQuota: boolean
  remaining: number
  limit: number
  resetAt: Date
}> {
  const subscription = await getCurrentSubscription(userId)
  
  if (!subscription) {
    return {
      hasQuota: false,
      remaining: 0,
      limit: 0,
      resetAt: new Date()
    }
  }

  const remaining = Math.max(0, subscription.quotaLimit - subscription.quotaUsed)
  
  return {
    hasQuota: subscription.quotaLimit === -1 || remaining > 0,
    remaining: subscription.quotaLimit === -1 ? Infinity : remaining,
    limit: subscription.quotaLimit,
    resetAt: subscription.quotaResetAt
  }
}

/**
 * 消耗配额
 */
export async function consumeQuota(
  userId: string,
  action: string,
  quantity: number = 1,
  metadata?: any
): Promise<boolean> {
  const subscription = await getCurrentSubscription(userId)
  
  if (!subscription) {
    throw new Error("No active subscription found")
  }

  // 检查配额
  if (subscription.quotaLimit !== -1 && 
      subscription.quotaUsed + quantity > subscription.quotaLimit) {
    // 记录配额不足事件
    await recordAnalyticsEvent({
      userId,
      eventType: "quota_exceeded",
      eventData: JSON.stringify({
        action,
        requested: quantity,
        available: subscription.quotaLimit - subscription.quotaUsed
      })
    })
    return false
  }

  // 更新订阅配额
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      quotaUsed: {
        increment: quantity
      }
    }
  })

  // 记录使用量
  await prisma.usageRecord.create({
    data: {
      userId,
      subscriptionId: subscription.id,
      action,
      quantity,
      quotaUsed: quantity,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    }
  })

  return true
}

/**
 * 重置配额（每月执行）
 */
export async function resetQuotas() {
  const now = new Date()
  
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      quotaResetAt: {
        lte: now
      }
    }
  })

  for (const sub of subscriptions) {
    const nextReset = new Date(sub.quotaResetAt)
    nextReset.setMonth(nextReset.getMonth() + 1)

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        quotaUsed: 0,
        quotaResetAt: nextReset
      }
    })
  }

  console.log(`✅ 重置了 ${subscriptions.length} 个订阅的配额`)
}

// ============ 辅助函数 ============

/**
 * 验证并应用折扣
 */
async function validateAndApplyDiscount(
  userId: string,
  code: string,
  planType: PlanType,
  billingCycle: BillingCycle,
  originalPrice: number
) {
  const discount = await prisma.discount.findFirst({
    where: {
      code,
      isActive: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: new Date() } }
      ],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      ]
    }
  })

  if (!discount) {
    throw new Error("Invalid or expired discount code")
  }

  // 检查使用次数
  if (discount.maxUses && discount.currentUses >= discount.maxUses) {
    throw new Error("Discount code usage limit reached")
  }

  // 检查用户使用次数
  const userUsage = await prisma.userDiscount.findUnique({
    where: {
      userId_discountId: {
        userId,
        discountId: discount.id
      }
    }
  })

  if (userUsage && discount.maxUsesPerUser && 
      userUsage.usedCount >= discount.maxUsesPerUser) {
    throw new Error("You have already used this discount code")
  }

  // 检查适用范围
  if (discount.applicablePlans) {
    const plans = JSON.parse(discount.applicablePlans)
    if (!plans.includes(planType)) {
      throw new Error("Discount code not applicable to this plan")
    }
  }

  if (discount.billingCycles) {
    const cycles = JSON.parse(discount.billingCycles)
    if (!cycles.includes(billingCycle)) {
      throw new Error("Discount code not applicable to this billing cycle")
    }
  }

  // 计算折扣金额
  let discountAmount = 0
  if (discount.type === "percentage") {
    discountAmount = originalPrice * (discount.value / 100)
  } else if (discount.type === "fixed") {
    discountAmount = Math.min(discount.value, originalPrice)
  }

  return {
    id: discount.id,
    type: discount.type,
    discountAmount
  }
}

/**
 * 记录折扣使用
 */
async function recordDiscountUsage(userId: string, discountId: string) {
  // 更新折扣总使用次数
  await prisma.discount.update({
    where: { id: discountId },
    data: {
      currentUses: {
        increment: 1
      }
    }
  })

  // 更新用户使用次数
  await prisma.userDiscount.upsert({
    where: {
      userId_discountId: {
        userId,
        discountId
      }
    },
    create: {
      userId,
      discountId,
      usedCount: 1
    },
    update: {
      usedCount: {
        increment: 1
      }
    }
  })
}

/**
 * 取消所有活跃订阅
 */
async function cancelActiveSubscriptions(userId: string) {
  await prisma.subscription.updateMany({
    where: {
      userId,
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING]
      }
    },
    data: {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date()
    }
  })
}

/**
 * 记录分析事件
 */
async function recordAnalyticsEvent(data: {
  userId: string
  eventType: string
  eventData?: string
}) {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { shop: true }
  })

  await prisma.analyticsEvent.create({
    data: {
      userId: data.userId,
      shop: user?.shop,
      eventType: data.eventType,
      eventData: data.eventData
    }
  })
}

