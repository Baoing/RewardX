/**
 * Shopify 折扣码工具函数
 * 用于在 Shopify 商店中创建折扣码（Price Rule + Discount Code）
 */

interface CreateShopifyDiscountParams {
  code: string
  type: "discount_percentage" | "discount_fixed" | "free_shipping" | "free_gift"
  value?: number // 百分比（如 10 表示 10%）或固定金额（如 5 表示 $5），free_shipping 和 free_gift 不需要
  title?: string // 折扣码标题
  startsAt?: Date // 开始时间
  endsAt?: Date // 结束时间
  usageLimit?: number // 使用次数限制（每个客户）
  minimumRequirement?: {
    type: "none" | "minimum_purchase_amount"
    amount?: number // 最低购买金额
  }
  giftProductId?: string // 赠品产品 ID（用于 free_gift 类型）
  giftVariantId?: string // 赠品变体 ID（用于 free_gift 类型）
}

interface ShopifyDiscountResult {
  discountCodeId: string
  priceRuleId: string
  code: string
}

/**
 * 在 Shopify 中创建折扣码
 * 使用 GraphQL API 创建 Price Rule 和 Discount Code
 */
export async function createShopifyDiscount(
  admin: any,
  params: CreateShopifyDiscountParams
): Promise<ShopifyDiscountResult> {
  const {
    code,
    type,
    value,
    title,
    startsAt,
    endsAt,
    usageLimit,
    minimumRequirement,
    giftProductId,
    giftVariantId
  } = params

  // 创建 Price Rule 和 Discount Code
  const priceRuleTitle = title || `Lottery Prize: ${code}`
  
  // 根据类型设置不同的折扣值
  let priceRuleValue: any
  if (type === "discount_percentage") {
    priceRuleValue = { percentage: value || 0 }
  } else if (type === "discount_fixed") {
    priceRuleValue = { fixedAmount: { amount: value || 0, currencyCode: "USD" } }
  } else if (type === "free_shipping") {
    // 免运费：使用 shipping 折扣
    priceRuleValue = { percentage: 0 } // 免运费在 customerGets 中单独处理
  } else if (type === "free_gift") {
    // 免费赠品：使用固定金额折扣（0元）或百分比折扣（100%）
    priceRuleValue = { percentage: 100 } // 或者使用 fixedAmount: { amount: 0 }
  } else {
    priceRuleValue = { percentage: 0 }
  }

  // 使用 discountCodeBasicCreate mutation 创建折扣码
  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 1) {
                edges {
                  node {
                    id
                    code
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  // 构建 customerGets 对象
  let customerGets: any = {
    value: priceRuleValue,
    items: {
      all: true
    }
  }

  // 如果是免运费，添加 shipping 折扣
  if (type === "free_shipping") {
    customerGets.shipping = {
      shippingDiscountAll: true
    }
  }

  // 如果是免费赠品，需要指定特定产品
  if (type === "free_gift" && giftProductId) {
    customerGets.items = {
      products: {
        productsToAdd: [giftProductId]
      }
    }
    // 赠品使用 100% 折扣
    customerGets.value = { percentage: 100 }
  }

  const priceRuleVariables = {
    basicCodeDiscount: {
      title: priceRuleTitle,
      code: code,
      startsAt: startsAt ? startsAt.toISOString() : null,
      endsAt: endsAt ? endsAt.toISOString() : null,
      customerSelection: {
        all: true
      },
      customerGets: customerGets,
      appliesOncePerCustomer: usageLimit === 1,
      usageLimit: usageLimit && usageLimit > 1 ? usageLimit : null,
      minimumRequirement: minimumRequirement?.type === "minimum_purchase_amount" && minimumRequirement.amount
        ? {
            subtotal: {
              greaterThanOrEqualToSubtotal: {
                amount: minimumRequirement.amount,
                currencyCode: "USD"
              }
            }
          }
        : null
    }
  }

  try {
    const response = await admin.graphql(mutation, {
      variables: priceRuleVariables
    })

    const data: any = await response.json()

    if (data.errors) {
      console.error("❌ Shopify GraphQL 错误:", data.errors)
      throw new Error(`Failed to create discount: ${data.errors[0]?.message || "Unknown error"}`)
    }

    const discountNode = data.data?.discountCodeBasicCreate?.codeDiscountNode
    const userErrors = data.data?.discountCodeBasicCreate?.userErrors

    if (userErrors && userErrors.length > 0) {
      console.error("❌ Shopify 用户错误:", userErrors)
      throw new Error(`Failed to create discount: ${userErrors[0]?.message || "Unknown error"}`)
    }

    if (!discountNode) {
      throw new Error("Failed to create discount: No discount node returned")
    }

    const discountCodeId = discountNode.id
    const discountCode = discountNode.codeDiscount?.codes?.edges?.[0]?.node

    if (!discountCode) {
      throw new Error("Failed to create discount: No discount code returned")
    }

    console.log("✅ Shopify 折扣码创建成功:", {
      discountCodeId: discountCode.id,
      priceRuleId: discountCodeId,
      code: discountCode.code
    })

    return {
      discountCodeId: discountCode.id,
      priceRuleId: discountCodeId,
      code: discountCode.code
    }
  } catch (error) {
    console.error("❌ 创建 Shopify 折扣码失败:", error)
    throw error
  }
}

/**
 * 删除 Shopify 折扣码
 */
export async function deleteShopifyDiscount(
  admin: any,
  discountCodeId: string
): Promise<boolean> {
  const mutation = `
    mutation discountCodeBasicDelete($id: ID!) {
      discountCodeBasicDelete(id: $id) {
        deletedCodeDiscountId
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const response = await admin.graphql(mutation, {
      variables: { id: discountCodeId }
    })

    const data: any = await response.json()

    if (data.errors) {
      console.error("❌ Shopify GraphQL 错误:", data.errors)
      return false
    }

    const userErrors = data.data?.discountCodeBasicDelete?.userErrors
    if (userErrors && userErrors.length > 0) {
      console.error("❌ Shopify 用户错误:", userErrors)
      return false
    }

    return !!data.data?.discountCodeBasicDelete?.deletedCodeDiscountId
  } catch (error) {
    console.error("❌ 删除 Shopify 折扣码失败:", error)
    return false
  }
}

