/**
 * 折扣管理服务
 * 处理折扣码的创建、验证、管理
 */

import { prisma } from "../db.server"

export interface CreateDiscountParams {
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

/**
 * 创建折扣码
 */
export async function createDiscount(params: CreateDiscountParams) {
  const {
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
  } = params

  // 检查折扣码是否已存在
  const existing = await prisma.discount.findUnique({
    where: { code }
  })

  if (existing) {
    throw new Error(`Discount code "${code}" already exists`)
  }

  const discount = await prisma.discount.create({
    data: {
      code: code.toUpperCase(),
      type,
      value,
      applicablePlans: applicablePlans ? JSON.stringify(applicablePlans) : null,
      billingCycles: billingCycles ? JSON.stringify(billingCycles) : null,
      maxUses,
      maxUsesPerUser: maxUsesPerUser ?? 1,
      startsAt,
      expiresAt,
      description,
      internalNotes
    }
  })

  return discount
}

/**
 * 更新折扣码
 */
export async function updateDiscount(
  discountId: string,
  updates: Partial<CreateDiscountParams>
) {
  const { applicablePlans, billingCycles, ...rest } = updates

  const discount = await prisma.discount.update({
    where: { id: discountId },
    data: {
      ...rest,
      applicablePlans: applicablePlans ? JSON.stringify(applicablePlans) : undefined,
      billingCycles: billingCycles ? JSON.stringify(billingCycles) : undefined
    }
  })

  return discount
}

/**
 * 停用折扣码
 */
export async function deactivateDiscount(discountId: string) {
  return await prisma.discount.update({
    where: { id: discountId },
    data: { isActive: false }
  })
}

/**
 * 获取所有折扣码
 */
export async function getAllDiscounts(includeInactive = false) {
  return await prisma.discount.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      _count: {
        select: {
          userDiscounts: true,
          subscriptions: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

/**
 * 获取折扣使用统计
 */
export async function getDiscountStats(discountId: string) {
  const discount = await prisma.discount.findUnique({
    where: { id: discountId },
    include: {
      subscriptions: {
        select: {
          id: true,
          userId: true,
          price: true,
          originalPrice: true,
          discountAmount: true,
          createdAt: true,
          user: {
            select: {
              shop: true,
              order: true
            }
          }
        }
      },
      userDiscounts: {
        include: {
          user: {
            select: {
              shop: true,
              order: true
            }
          }
        }
      }
    }
  })

  if (!discount) {
    throw new Error("Discount not found")
  }

  const totalRevenue = discount.subscriptions.reduce((sum, sub) => sum + sub.price, 0)
  const totalDiscount = discount.subscriptions.reduce((sum, sub) => sum + sub.discountAmount, 0)

  return {
    discount,
    stats: {
      totalUses: discount.currentUses,
      totalRevenue,
      totalDiscount,
      uniqueUsers: discount.userDiscounts.length
    }
  }
}

/**
 * 预定义折扣码模板
 */
export const DISCOUNT_TEMPLATES = {
  // 新用户优惠
  NEW_USER_20: {
    code: "WELCOME20",
    type: "percentage" as const,
    value: 20,
    maxUsesPerUser: 1,
    description: "20% off for new users"
  },

  // 黑色星期五
  BLACK_FRIDAY: {
    code: "BF2024",
    type: "percentage" as const,
    value: 30,
    description: "Black Friday 30% off"
  },

  // 年付优惠
  ANNUAL_SAVE: {
    code: "ANNUAL15",
    type: "percentage" as const,
    value: 15,
    billingCycles: ["yearly"],
    description: "15% off for annual plans"
  },

  // 企业套餐优惠
  ENTERPRISE_100: {
    code: "ENTERPRISE100",
    type: "fixed" as const,
    value: 100,
    applicablePlans: ["enterprise"],
    description: "$100 off Enterprise plan"
  }
}

/**
 * 批量创建折扣码
 */
export async function createBulkDiscounts(
  prefix: string,
  count: number,
  params: Omit<CreateDiscountParams, "code">
) {
  const discounts = []

  for (let i = 1; i <= count; i++) {
    const code = `${prefix}${String(i).padStart(4, "0")}`

    try {
      const discount = await createDiscount({
        ...params,
        code
      })
      discounts.push(discount)
    } catch (error) {
      console.error(`Failed to create discount ${code}:`, error)
    }
  }

  return discounts
}


