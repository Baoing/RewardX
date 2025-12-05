import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { randomUUID } from "crypto"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"
import { selectPrize, isCampaignValid, calculateExpiresAt } from "@/utils/lottery.server"
import { handleCorsPreflight, jsonWithCors, errorResponseWithCors } from "@/utils/api.server"
import { createDiscountCodeForPrize } from "@/services/discount-code.server"

// 强制允许所有来源访问此接口
const ALLOW_ALL_ORIGINS = true
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

// 从请求中获取 shop 信息（支持多种方式）
const getShopFromRequest = (request: Request): string | null => {
  const url = new URL(request.url)
  const shopParam = url.searchParams.get("shop")
  if (shopParam) {
    return shopParam.includes(".") ? shopParam : `${shopParam}.myshopify.com`
  }
  const referer = request.headers.get("Referer")
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const hostname = refererUrl.hostname
      if (hostname.includes(".myshopify.com")) {
        return hostname
      }
      const shopMatch = referer.match(/https?:\/\/([^.]+\.myshopify\.com)/)
      if (shopMatch) {
        return shopMatch[1]
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse Referer:", e)
    }
  }
  return null
}

// 处理 OPTIONS 预检请求（在 loader 中处理，因为 React Router v7 的 loader 会处理 OPTIONS 请求）
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // 处理 OPTIONS 预检请求（强制允许所有来源）
  const preflightResponse = handleCorsPreflight(request, true)
  if (preflightResponse) {
    return preflightResponse
  }

  // 如果不是 OPTIONS 请求，返回 405 Method Not Allowed（因为此路由只支持 POST）
  return new Response("Method Not Allowed", { status: 405 })
}

export const action = async ({ request }: ActionFunctionArgs) => {
  // 处理 OPTIONS 预检请求（强制允许所有来源）
  // 注意：虽然 loader 已经处理了 OPTIONS，但这里也保留作为备用
  const preflightResponse = handleCorsPreflight(request, true)
  if (preflightResponse) {
    return preflightResponse
  }

  try {
    const data: PlayLotteryRequest = await request.json()
    const { campaignId, type } = data

    if (!campaignId) {
      return errorResponseWithCors("Campaign ID is required", 400, request, ALLOW_ALL_ORIGINS)
    }

    // 尝试获取 shop 信息
    let shop: string | null = null
    let admin: any = null
    let session: any = null

    // 方法1：尝试从请求中提取 shop
    shop = getShopFromRequest(request)

    // 方法2：尝试认证获取 admin session（用于验证订单和创建折扣码）
    // 注意：即使 shop 已经通过 query 参数获取到了，也应该尝试获取 admin session
    try {
      const authResult = await authenticate.admin(request)
      admin = authResult.admin
      session = authResult.session
      // 如果 shop 还没有获取到，使用 session.shop
      if (!shop) {
        shop = session.shop
      }
    } catch (authError) {
      // 不抛出错误，允许继续（storefront 调用时可能没有 admin session）
    }

    if (!shop) {
      // 如果仍然无法获取 shop，尝试从 campaign 中获取（需要先查询 campaign）
      // 但这样会有安全问题，所以先返回错误
      return errorResponseWithCors(
        "Shop domain is required. Please provide 'shop' query parameter or ensure you have a valid Shopify session.",
        400,
        request,
        ALLOW_ALL_ORIGINS
      )
    }

    const user = await prisma.user.findUnique({
      where: { shop }
    })

    if (!user) {
      return errorResponseWithCors("User not found", 404, request, ALLOW_ALL_ORIGINS)
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
      return errorResponseWithCors("Campaign not found", 404, request, ALLOW_ALL_ORIGINS)
    }

    // 验证活动有效性
    const validity = isCampaignValid(campaign)
    if (!validity.valid) {
      return errorResponseWithCors(validity.reason || "Campaign is not valid", 400, request, ALLOW_ALL_ORIGINS)
    }

    // 根据类型执行不同的验证和抽奖
    if (type === "order") {
      return await handleOrderLottery(admin, campaign, data, user.id, request)
    } else if (type === "email_form") {
      return await handleEmailFormLottery(admin, campaign, data, user.id, request)
    } else {
      return errorResponseWithCors("Invalid lottery type", 400, request, ALLOW_ALL_ORIGINS)
    }

  } catch (error) {
    return errorResponseWithCors(
      error instanceof Error ? error.message : "Unknown error",
      500,
      request,
      ALLOW_ALL_ORIGINS
    )
  }
}

// 订单抽奖
async function handleOrderLottery(admin: any, campaign: any, data: PlayLotteryRequest, userId: string, request: Request) {
  const { orderId, orderNumber } = data

  // 支持通过订单号或订单ID
  if (!orderId && !orderNumber) {
    return errorResponseWithCors("Order ID or order number is required", 400, request, ALLOW_ALL_ORIGINS)
  }

  // 尝试获取 admin session（可选，用于后备验证）
  if (!admin) {
    try {
      const authResult = await authenticate.admin(request)
      admin = authResult.admin
    } catch (authError) {
      // 不返回错误，允许从数据库验证
    }
  }

  let order: any = null
  let finalOrderId: string | null = null
  let orderAmount = 0
  let customerName: string | null = null
  let customerId: string | null = null
  let phone: string | null = null
  let email: string | null = null

  // 方法1：优先从数据库验证订单（支持 storefront 调用）
  const shop = await prisma.user.findUnique({
    where: { id: userId },
    select: { shop: true }
  })

  if (shop) {
    let dbOrder = null

    // 通过订单号查询
    if (orderNumber && !orderId) {
      const cleanOrderNumber = orderNumber.replace(/^#/, "").trim()
      dbOrder = await prisma.order.findFirst({
        where: {
          shop: shop.shop,
          orderNumber: `#${cleanOrderNumber}`
        }
      })
    } else if (orderId) {
      // 通过订单 ID 查询
      dbOrder = await prisma.order.findUnique({
        where: { id: orderId }
      })
    }

    if (dbOrder) {
      order = {
        id: dbOrder.id,
        name: dbOrder.name,
        totalPriceSet: {
          shopMoney: {
            amount: dbOrder.totalPrice.toString(),
            currencyCode: dbOrder.currencyCode
          }
        },
        customer: {
          id: dbOrder.customerId,
          displayName: dbOrder.customerName,
          phone: dbOrder.customerPhone,
          email: dbOrder.customerEmail
        },
        email: dbOrder.email
      }
      finalOrderId = dbOrder.id
      orderAmount = dbOrder.totalPrice
      customerName = dbOrder.customerName
      customerId = dbOrder.customerId
      phone = dbOrder.customerPhone
      email = dbOrder.customerEmail || dbOrder.email
    }
  }

  // 方法2：如果数据库中没有找到，且有 admin session，从 Shopify API 查询（后备方案）
  if (!order && admin) {
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
      return errorResponseWithCors(
        orderData.errors[0]?.message || "Failed to query order",
        400,
        request,
        ALLOW_ALL_ORIGINS
      )
    }

    const orders = orderData.data?.orders?.edges || []
    if (orders.length === 0) {
      return errorResponseWithCors(`Order not found: ${orderNumber}`, 404, request, ALLOW_ALL_ORIGINS)
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
        return errorResponseWithCors("Order not found", 404, request, ALLOW_ALL_ORIGINS)
      }

      finalOrderId = order.id
      orderAmount = parseFloat(order.totalPriceSet.shopMoney.amount)
      customerName = order.customer?.displayName || null
      customerId = order.customer?.id || null
      phone = order.customer?.phone || null
      email = order.customer?.email || null
    }

    // 如果成功查询到订单，使用订单信息
    if (order) {
      finalOrderId = order.id
      orderAmount = parseFloat(order.totalPriceSet.shopMoney.amount)
      customerName = order.customer?.displayName || null
      customerId = order.customer?.id || null
      phone = order.customer?.phone || null
      email = order.customer?.email || null
    }
  }

  // 订单验证是必需的，如果没有查询到订单，返回错误
  if (!finalOrderId || !order) {
    return errorResponseWithCors(
      orderNumber 
        ? `Order not found: ${orderNumber}. Please verify the order number is correct.`
        : orderId
        ? `Order not found: ${orderId}. Please verify the order ID is correct.`
        : "Order verification failed. Please provide a valid order number or order ID.",
      404,
      request,
      ALLOW_ALL_ORIGINS
    )
  }

  // 检查订单是否已经抽过奖（通过数据库查询）
  const existingEntry = await prisma.lotteryEntry.findFirst({
    where: {
      campaignId: campaign.id,
      orderId: finalOrderId
    } as any
  })

  if (existingEntry) {
    // 如果已经抽过奖，返回之前的结果
    const previousPrize = existingEntry.prizeId ? await prisma.prize.findUnique({
      where: { id: existingEntry.prizeId }
    }) : null

    return jsonWithCors({
      success: false,
      hasPlayed: true,
      prizeId: existingEntry.prizeId,
      previousEntry: {
        isWinner: existingEntry.isWinner,
        prizeName: existingEntry.prizeName,
        discountCode: existingEntry.discountCode || undefined
      }
    }, undefined, request, ALLOW_ALL_ORIGINS)
  }

  // 订单金额应该从验证后的订单中获取
  if (!orderAmount && order) {
    orderAmount = parseFloat(order.totalPriceSet.shopMoney.amount)
  }

  if (!orderAmount) {
    orderAmount = 0
  }

  // 执行抽奖并返回索引
  return await performLottery(admin, campaign, {
    shop: shop?.shop || null, // 传递 shop 信息，用于 storefront 调用时创建折扣码
    campaignType: "order",
    orderId: finalOrderId,
    orderNumber: order?.name || orderNumber || `#${finalOrderId}`,
    orderAmount,
    customerName: customerName || null,
    customerId: customerId || null,
    phone: phone || null,
    email: email ?? undefined,
    userId
    // shippingAddress: data.shippingAddress // 保留字段，供将来使用
  }, request)
}

// 邮件表单抽奖
async function handleEmailFormLottery(admin: any, campaign: any, data: PlayLotteryRequest, userId: string, request: Request) {
  const { email, name, phone } = data

  // 验证必填字段
  if (!email) {
    return errorResponseWithCors("Email is required", 400, request, ALLOW_ALL_ORIGINS)
  }

  if (campaign.requireName && !name) {
    return errorResponseWithCors("Name is required", 400, request, ALLOW_ALL_ORIGINS)
  }

  if (campaign.requirePhone && !phone) {
    return errorResponseWithCors("Phone is required", 400, request, ALLOW_ALL_ORIGINS)
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
      return errorResponseWithCors(
        `Maximum plays per customer (${campaign.maxPlaysPerCustomer}) reached`,
        400,
        request,
        ALLOW_ALL_ORIGINS
      )
    }
  }

  // 获取 shop 信息（用于 storefront 调用时创建折扣码）
  const shopInfo = await prisma.user.findUnique({
    where: { id: userId },
    select: { shop: true }
  })

  // 执行抽奖
  return await performLottery(admin, campaign, {
    shop: shopInfo?.shop || null, // 传递 shop 信息，用于 storefront 调用时创建折扣码
    campaignType: "email_subscribe",
    order: email, // 将 email 存储到 order 字段
    customerName: name,
    phone,
    email: email,
    userId
    // shippingAddress: data.shippingAddress // 保留字段，供将来使用
  }, request)
}

// 执行抽奖核心逻辑
async function performLottery(admin: any, campaign: any, entryData: any, request?: Request) {
  // 1. 抽奖算法选择奖品
  const selectedPrize = selectPrize(campaign.Prize)

  if (!selectedPrize) {
    return errorResponseWithCors("No prizes available", 400, request, ALLOW_ALL_ORIGINS)
  }

  const isWinner = selectedPrize.type !== "no_prize"

  // 2. 创建折扣码（如果中奖）
  let discountCode = null
  let discountCodeId = null

  if (isWinner) {
    // 使用封装的折扣码创建服务
    const discountResult = await createDiscountCodeForPrize({
      prize: {
        id: selectedPrize.id,
        name: selectedPrize.name,
        type: selectedPrize.type as "discount_percentage" | "discount_fixed" | "free_shipping" | "free_gift" | "no_prize",
        discountValue: selectedPrize.discountValue || undefined,
        discountCode: selectedPrize.discountCode || undefined,
        giftProductId: selectedPrize.giftProductId || undefined,
        giftVariantId: selectedPrize.giftVariantId || undefined
      },
      shop: entryData.shop || undefined,
      request: request,
      expiresInDays: 30,
      usageLimit: 1,
      minimumRequirement: {
        type: "none" // 可以根据活动配置设置最低购买金额
      }
    })

    discountCode = discountResult.code
    discountCodeId = discountResult.discountCodeId

    // 如果创建失败，记录错误但不中断流程
    if (!discountResult.created && discountResult.error) {
      console.error("❌ 创建 Shopify 折扣码失败:", discountResult.error)
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
  }, undefined, request, ALLOW_ALL_ORIGINS)
}

