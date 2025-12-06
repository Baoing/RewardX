/**
 * 折扣码创建服务
 * 封装完整的折扣码创建流程，包括生成折扣码、获取 admin 对象、在 Shopify 中创建折扣码
 */

import { authenticate } from "@/shopify.server"
import { generateDiscountCode, calculateExpiresAt } from "@/utils/lottery.server"
import { createShopifyDiscount } from "@/utils/shopify-discount.server"
import { getAdminByShop } from "@/utils/admin.server"

export interface PrizeInfo {
  id: string
  name: string
  type: "discount_percentage" | "discount_fixed" | "free_shipping" | "free_gift" | "no_prize"
  discountValue?: number
  discountCode?: string // 预定义的折扣码
  giftProductId?: string
  giftVariantId?: string
}

export interface CreateDiscountCodeParams {
  prize: PrizeInfo
  shop?: string // Shopify 店铺域名（用于 storefront 调用时获取 admin）
  request?: Request // HTTP 请求对象（用于 admin 调用时获取 admin）
  expiresInDays?: number // 折扣码过期天数，默认 30 天
  usageLimit?: number // 使用次数限制，默认 1
  minimumRequirement?: {
    type: "none" | "minimum_purchase_amount"
    amount?: number
  }
  title?: string // 折扣码标题，默认使用 "Lottery Prize: {prize.name}"
}

export interface DiscountCodeResult {
  code: string // 折扣码字符串
  discountCodeId: string | null // Shopify 折扣码 ID（如果创建成功）
  priceRuleId: string | null // Shopify Price Rule ID（如果创建成功）
  created: boolean // 是否在 Shopify 中成功创建
  error?: string // 错误信息（如果创建失败）
}

/**
 * 创建折扣码（完整流程）
 * 
 * 功能：
 * 1. 生成或使用预定义的折扣码字符串
 * 2. 自动获取 admin 对象（支持 admin 调用和 storefront 调用）
 * 3. 在 Shopify 客户商店中创建折扣码
 * 4. 返回折扣码信息
 * 
 * @param params - 创建折扣码的参数
 * @returns 折扣码创建结果
 */
export async function createDiscountCodeForPrize(
  params: CreateDiscountCodeParams
): Promise<DiscountCodeResult> {
  const {
    prize,
    shop,
    request,
    expiresInDays = 30,
    usageLimit = 1,
    minimumRequirement = { type: "none" },
    title
  } = params

  // 1. 生成折扣码字符串
  const discountCode = prize.discountCode || generateDiscountCode("LOTTERY")

  // 2. 如果奖品类型是 "no_prize"，不创建折扣码
  if (prize.type === "no_prize") {
    return {
      code: discountCode,
      discountCodeId: null,
      priceRuleId: null,
      created: false
    }
  }

  // 3. 尝试获取 admin 对象（用于在 Shopify 中创建折扣码）
  let admin: any = null

  // 方法1：尝试从请求中获取 admin session（admin 调用时）
  if (request) {
    try {
      const authResult = await authenticate.admin(request)
      admin = authResult.admin
    } catch (authError) {
      // 认证失败，继续尝试方法2
    }
  }

  // 方法2：如果仍然没有 admin，尝试通过 shop 信息从数据库获取（storefront 调用时）
  if (!admin && shop) {
    console.log(`🔍 尝试通过 shop 获取 admin 对象: ${shop}`)
    try {
      admin = await getAdminByShop(shop)
      if (admin) {
        console.log(`✅ 成功通过 shop 获取 admin 对象: ${shop}`)
      } else {
        console.warn(`⚠️ 通过 shop 获取 admin 对象失败: ${shop} (返回 null)`)
      }
    } catch (error) {
      console.error(`❌ 通过 shop 获取 admin 对象失败: ${shop}`, error)
    }
  } else if (!admin && !shop) {
    console.warn(`⚠️ 无法获取 admin 对象：既没有 request 也没有 shop 参数`)
  }

  // 4. 如果没有 admin 对象，返回折扣码字符串但不创建 Shopify 折扣码
  if (!admin) {
    console.warn(`⚠️ 无法获取 admin 对象，折扣码将不会在 Shopify 中创建（但折扣码字符串已生成）`)
    console.warn(`   - shop: ${shop || "未提供"}`)
    console.warn(`   - request: ${request ? "已提供" : "未提供"}`)
    return {
      code: discountCode,
      discountCodeId: null,
      priceRuleId: null,
      created: false,
      error: "No admin session available"
    }
  }

  // 5. 根据奖品类型设置折扣码类型
  let discountType: "discount_percentage" | "discount_fixed" | "free_shipping" | "free_gift"
  if (prize.type === "discount_percentage") {
    discountType = "discount_percentage"
  } else if (prize.type === "discount_fixed") {
    discountType = "discount_fixed"
  } else if (prize.type === "free_shipping") {
    discountType = "free_shipping"
  } else if (prize.type === "free_gift") {
    discountType = "free_gift"
  } else {
    // 默认使用百分比折扣
    discountType = "discount_percentage"
  }

  // 6. 在 Shopify 客户商店中创建折扣码
  try {
    const expiresAt = calculateExpiresAt(expiresInDays)
    const discountTitle = title || `Lottery Prize: ${prize.name}`

    const shopifyDiscount = await createShopifyDiscount(admin, {
      code: discountCode,
      type: discountType,
      value: prize.discountValue || 0,
      title: discountTitle,
      endsAt: expiresAt,
      usageLimit,
      minimumRequirement,
      giftProductId: prize.giftProductId || undefined,
      giftVariantId: prize.giftVariantId || undefined
    })

    return {
      code: discountCode,
      discountCodeId: shopifyDiscount.discountCodeId,
      priceRuleId: shopifyDiscount.priceRuleId,
      created: true
    }
  } catch (error) {
    console.error("❌ 创建 Shopify 折扣码失败:", error)
    return {
      code: discountCode,
      discountCodeId: null,
      priceRuleId: null,
      created: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

