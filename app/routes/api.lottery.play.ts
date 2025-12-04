import type { ActionFunctionArgs } from "react-router"
import { randomUUID } from "crypto"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"
import { selectPrize, generateDiscountCode, isCampaignValid, calculateExpiresAt } from "@/utils/lottery.server"
import { createShopifyDiscount } from "@/utils/shopify-discount.server"
import { handleCorsPreflight, jsonWithCors } from "@/utils/api.server"
// Draft Order 功能保留在 webhook 中，供将来需要时使用
// import { createDraftOrder } from "@/utils/shopify-draft-order.server"

interface PlayLotteryRequest {
  campaignId: string
  type: "order" | "email_form"
  // 订单抽奖（支持订单号或订单ID）
  orderId?: string
  orderNumber?: string // 新增：支持通过订单号验证和抽奖
  // 邮件表单抽奖
  email?: string
  name?: string
  phone?: string
  // 收件信息（保留字段，供将来 Draft Order 功能使用）
  // shippingAddress?: {
  //   firstName?: string
  //   lastName?: string
  //   address1?: string
  //   address2?: string
  //   city?: string
  //   province?: string
  //   country?: string
  //   zip?: string
  //   phone?: string
  // }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  // 处理 OPTIONS 预检请求
  const preflightResponse = handleCorsPreflight(request)
  if (preflightResponse) {
    return preflightResponse
  }

  try {
    const { admin, session } = await authenticate.admin(request)
    const data: PlayLotteryRequest = await request.json()

    const { campaignId, type } = data

    if (!campaignId) {
      return jsonWithCors({ success: false, error: "Campaign ID is required" }, { status: 400 }, request)
    }

    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })

    if (!user) {
      return jsonWithCors({ success: false, error: "User not found" }, { status: 404 }, request)
    }

    // 获取活动
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: user.id
      },
      include: {
        Prize: {
          where: { isActive: true },
          orderBy: { chancePercentage: "desc" }
        }
      } as any
    })

    if (!campaign) {
      return jsonWithCors({ success: false, error: "Campaign not found" }, { status: 404 }, request)
    }

    // 验证活动有效性
    const validity = isCampaignValid(campaign)
    if (!validity.valid) {
      return jsonWithCors({ success: false, error: validity.reason }, { status: 400 }, request)
    }

    // 根据类型执行不同的验证和抽奖
    if (type === "order") {
      return await handleOrderLottery(admin, campaign, data, user.id, request)
    } else if (type === "email_form") {
      return await handleEmailFormLottery(admin, campaign, data, user.id, request)
    } else {
      return jsonWithCors({ success: false, error: "Invalid lottery type" }, { status: 400 }, request)
    }

  } catch (error) {
    return jsonWithCors({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 }, request)
  }
}

// 订单抽奖
async function handleOrderLottery(admin: any, campaign: any, data: PlayLotteryRequest, userId: string, request: Request) {
  const { orderId, orderNumber } = data

  // 支持通过订单号或订单ID
  if (!orderId && !orderNumber) {
    return jsonWithCors({ success: false, error: "Order ID or order number is required" }, { status: 400 }, request)
  }

  let order: any = null
  let finalOrderId: string | null = null
  if (orderNumber && !orderId) {
    // 如果提供了订单号，先通过订单号查询订单
    const cleanOrderNumber = orderNumber.replace(/^#/, "").trim()
    const query = `name:"#${cleanOrderNumber}"`

    const orderResponse = await admin.graphql(
      `#graphql
      query getOrderByNumber($query: String!) {
        orders(first: 1, query: $query) {
          edges {
            node {
              id
              name
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              displayFinancialStatus
              displayFulfillmentStatus
            }
          }
        }
      }`,
      {
        variables: {
          query: query
        }
      }
    )

    const orderData: any = await orderResponse.json()

    if (orderData.errors) {
      return jsonWithCors({
        success: false,
        error: orderData.errors[0]?.message || "Failed to query order"
      }, { status: 400 }, request)
    }

    const orders = orderData.data?.orders?.edges || []
    if (orders.length === 0) {
      return jsonWithCors({
        success: false,
        error: `Order not found: ${orderNumber}`
      }, { status: 404 }, request)
    }

    order = orders[0].node
    finalOrderId = order.id

    // 尝试获取客户信息
    try {
      const customerResponse = await admin.graphql(
        `#graphql
        query getOrderCustomer($id: ID!) {
          order(id: $id) {
            customer {
              id
              displayName
              phone
            }
          }
        }`,
        {
          variables: { id: finalOrderId }
        }
      )

      const customerData: any = await customerResponse.json()
      if (!customerData.errors && customerData.data?.order?.customer) {
        order.customer = customerData.data.order.customer
      } else {
        order.customer = null
      }
    } catch (customerError) {
      order.customer = null
    }
  } else if (orderId) {
    // 如果提供了订单ID，直接查询
    const orderResponse = await admin.graphql(
      `#graphql
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          name
          totalPriceSet { shopMoney { amount } }
          displayFinancialStatus
          email
          customer { id displayName phone }
        }
      }`,
      { variables: { id: orderId } }
    )

    const orderData = await orderResponse.json()
    order = orderData.data?.order

    if (!order) {
      return jsonWithCors({ success: false, error: "Order not found" }, { status: 404 }, request)
    }

    finalOrderId = order.id
  }

  // 检查订单是否已经抽过奖
  if (!finalOrderId) {
    return jsonWithCors({ success: false, error: "Order ID is required" }, { status: 400 }, request)
  }

  // 计算订单金额（暗门情况下使用假订单的金额）
  const orderAmount = parseFloat(order.totalPriceSet.shopMoney.amount)

  // 执行抽奖并返回索引
  return await performLottery(admin, campaign, {
    campaignType: "order",
    orderId: finalOrderId,
    orderNumber: order.name,
    orderAmount,
    customerName: order.customer?.displayName,
    customerId: order.customer?.id,
    phone: order.customer?.phone,
    email: order.customer?.email || undefined,
    userId
    // shippingAddress: data.shippingAddress // 保留字段，供将来使用
  }, request)
}

// 邮件表单抽奖
async function handleEmailFormLottery(admin: any, campaign: any, data: PlayLotteryRequest, userId: string, request: Request) {
  const { email, name, phone } = data

  // 验证必填字段
  if (!email) {
    return jsonWithCors({ success: false, error: "Email is required" }, { status: 400 }, request)
  }

  if (campaign.requireName && !name) {
    return jsonWithCors({ success: false, error: "Name is required" }, { status: 400 }, request)
  }

  if (campaign.requirePhone && !phone) {
    return jsonWithCors({ success: false, error: "Phone is required" }, { status: 400 }, request)
  }

  // 检查参与次数限制（通过 email 检查，存储在 order 字段中）
  if (campaign.maxPlaysPerCustomer && email) {
    const existingPlays = await prisma.lotteryEntry.count({
      where: {
        campaignId: campaign.id,
        order: email // 使用 order 字段存储 email
      } as any
    })

    if (existingPlays >= campaign.maxPlaysPerCustomer) {
      return jsonWithCors({
        success: false,
        error: `Maximum plays per customer (${campaign.maxPlaysPerCustomer}) reached`
      }, { status: 400 }, request)
    }
  }

  // 执行抽奖
  return await performLottery(admin, campaign, {
    campaignType: "email_subscribe",
    order: email, // 将 email 存储到 order 字段
    customerName: name,
    phone,
    email: email,
    userId
    // shippingAddress: data.shippingAddress // 保留字段，供将来使用
  })
}

// 执行抽奖核心逻辑
async function performLottery(admin: any, campaign: any, entryData: any, request?: Request) {
  // 1. 抽奖算法选择奖品
  const selectedPrize = selectPrize(campaign.Prize)

  if (!selectedPrize) {
    return jsonWithCors({ success: false, error: "No prizes available" }, { status: 400 }, request)
  }

  const isWinner = selectedPrize.type !== "no_prize"

  // 2. 生成折扣码（如果中奖）
  let discountCode = null
  let discountCodeId = null

  if (isWinner) {
    // 所有中奖类型都创建折扣码（discount_percentage, discount_fixed, free_shipping, free_gift）
    discountCode = selectedPrize.discountCode || generateDiscountCode("LOTTERY")

    // 调用 Shopify API 创建折扣码
    try {
      const expiresAt = calculateExpiresAt(30) // 默认 30 天后过期

      // 根据奖品类型设置折扣码参数
      let discountType: "discount_percentage" | "discount_fixed" | "free_shipping" | "free_gift"
      if (selectedPrize.type === "discount_percentage") {
        discountType = "discount_percentage"
      } else if (selectedPrize.type === "discount_fixed") {
        discountType = "discount_fixed"
      } else if (selectedPrize.type === "free_shipping") {
        discountType = "free_shipping"
      } else if (selectedPrize.type === "free_gift") {
        discountType = "free_gift"
      } else {
        // 默认使用百分比折扣
        discountType = "discount_percentage"
      }

      const shopifyDiscount = await createShopifyDiscount(admin, {
        code: discountCode,
        type: discountType,
        value: selectedPrize.discountValue || 0,
        title: `Lottery Prize: ${selectedPrize.name}`,
        endsAt: expiresAt,
        usageLimit: 1, // 每个客户只能使用一次
        minimumRequirement: {
          type: "none" // 可以根据活动配置设置最低购买金额
        },
        // 免费赠品需要指定产品 ID
        giftProductId: selectedPrize.giftProductId || undefined,
        giftVariantId: selectedPrize.giftVariantId || undefined
      })

      discountCodeId = shopifyDiscount.discountCodeId
    } catch (error) {
      console.error("❌ 创建 Shopify 折扣码失败:", error)
      // 即使 Shopify 折扣码创建失败，也继续流程，但记录错误
      // discountCodeId 保持为 null，前端仍会显示折扣码，但可能无法在 Shopify 中使用
    }
  }

  // 3. 使用事务创建抽奖记录并更新统计
  const result = await prisma.$transaction(async (tx) => {
    // 创建抽奖记录
    const now = new Date()
    const entry = await tx.lotteryEntry.create({
      data: {
        id: randomUUID(), // 生成 UUID
        campaignId: campaign.id,
        userId: entryData.userId,
        campaignType: entryData.campaignType,
        orderId: entryData.orderId,
        orderNumber: entryData.orderNumber,
        orderAmount: entryData.orderAmount,
        order: entryData.order || null, // 使用 order 字段存储 email 或其他数据
        customerName: entryData.customerName || null,
        customerId: entryData.customerId || null,
        phone: entryData.phone || null,
        prizeId: selectedPrize.id,
        prizeName: selectedPrize.name,
        prizeType: selectedPrize.type,
        prizeValue: selectedPrize.discountValue?.toString() || null,
        isWinner,
        status: "pending",
        discountCode: discountCode || null,
        discountCodeId: discountCodeId || null,
        expiresAt: isWinner ? calculateExpiresAt(30) : null,
        updatedAt: now // 手动设置 updatedAt
      } as any
    })

    // 更新活动统计
    await tx.campaign.update({
      where: { id: campaign.id },
      data: {
        totalPlays: { increment: 1 },
        totalWins: isWinner ? { increment: 1 } : undefined,
        totalOrders: entryData.orderId ? { increment: 1 } : undefined
      }
    })

    // 更新奖品库存
    await tx.prize.update({
      where: { id: selectedPrize.id },
      data: {
        usedStock: { increment: 1 }
      }
    })

    return entry
  })

  // 4. 返回结果（包含奖品 ID，前端根据 ID 查找索引）
  // 注意：所有奖品类型（包括 free_gift）都通过折扣码方式发放，不自动创建 Draft Order
  // Draft Order 功能保留在 webhook 中，供将来需要时使用
  return jsonWithCors({
    success: true,
    prizeId: selectedPrize.id, // 返回奖品 ID，让前端根据 ID 查找索引
    entry: {
      id: result.id,
      isWinner,
      prize: isWinner ? {
        id: selectedPrize.id,
        name: selectedPrize.name,
        type: selectedPrize.type,
        discountValue: selectedPrize.discountValue,
        discountCode,
        expiresAt: result.expiresAt
      } : undefined
    }
  }, undefined, request)
}

