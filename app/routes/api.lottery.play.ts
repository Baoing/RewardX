import type { ActionFunctionArgs } from "react-router"
import { randomUUID } from "crypto"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"
import { selectPrize, generateDiscountCode, isCampaignValid, calculateExpiresAt } from "@/utils/lottery.server"

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
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request)
    const data: PlayLotteryRequest = await request.json()

    const { campaignId, type } = data

    if (!campaignId) {
      return Response.json({ success: false, error: "Campaign ID is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
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
      return Response.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    // 验证活动有效性
    const validity = isCampaignValid(campaign)
    if (!validity.valid) {
      return Response.json({ success: false, error: validity.reason }, { status: 400 })
    }

    // 根据类型执行不同的验证和抽奖
    if (type === "order") {
      return await handleOrderLottery(admin, campaign, data, user.id)
    } else if (type === "email_form") {
      return await handleEmailFormLottery(campaign, data, user.id)
    } else {
      return Response.json({ success: false, error: "Invalid lottery type" }, { status: 400 })
    }

  } catch (error) {
    console.error("❌ Error playing lottery:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// 订单抽奖
async function handleOrderLottery(admin: any, campaign: any, data: PlayLotteryRequest, userId: string) {
  const { orderId, orderNumber } = data

  // 支持通过订单号或订单ID
  if (!orderId && !orderNumber) {
    return Response.json({ success: false, error: "Order ID or order number is required" }, { status: 400 })
  }

  let order: any = null
  let finalOrderId: string | null = null

  // 🔓 暗门：如果订单号是 #10086，跳过订单验证，直接抽奖
  if (orderNumber && orderNumber.trim() === "#10086") {
    console.log("🔓 暗门激活：跳过订单验证")
    finalOrderId = `gid://shopify/Order/10086`
    order = {
      id: finalOrderId,
      name: "#10086",
      totalPriceSet: {
        shopMoney: {
          amount: "100.00",
          currencyCode: "USD"
        }
      },
      displayFinancialStatus: campaign.allowedOrderStatus || "paid",
      displayFulfillmentStatus: "fulfilled",
      customer: null
    }
  } else if (orderNumber && !orderId) {
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
      return Response.json({
        success: false,
        error: orderData.errors[0]?.message || "Failed to query order"
      }, { status: 400 })
    }

    const orders = orderData.data?.orders?.edges || []
    if (orders.length === 0) {
      return Response.json({
        success: false,
        error: `Order not found: ${orderNumber}`
      }, { status: 404 })
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
      return Response.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    finalOrderId = order.id
  }

  // 检查订单是否已经抽过奖
  if (!finalOrderId) {
    return Response.json({ success: false, error: "Order ID is required" }, { status: 400 })
  }

  // 🔓 暗门：订单号 #10086 跳过已抽过奖检查，允许重复抽奖
  const isBackdoor = orderNumber && orderNumber.trim() === "#10086"
  let existingEntry: any = null

  if (!isBackdoor) {
    existingEntry = await prisma.lotteryEntry.findUnique({
      where: { orderId: finalOrderId }
    })

    if (existingEntry) {
      // 如果已经抽过奖，返回之前的结果和奖品 ID（前端根据 ID 查找索引）
      return Response.json({
        success: false,
        error: "Order has already been used",
        hasPlayed: true,
        prizeId: existingEntry.prizeId, // 返回奖品 ID，让前端根据 ID 查找索引
        previousEntry: {
          id: existingEntry.id,
          isWinner: existingEntry.isWinner,
          prizeName: existingEntry.prizeName,
          discountCode: existingEntry.discountCode
        }
      }, { status: 400 })
    }
  } else {
    console.log("🔓 暗门：跳过已抽过奖检查，允许重复抽奖")
  }

  // 🔓 暗门：跳过订单状态、金额和客户参与次数检查
  if (!isBackdoor) {
    // 检查订单状态（统一转换为小写比较）
    const orderStatus = order.displayFinancialStatus?.toLowerCase() || ""
    const allowedStatus = campaign.allowedOrderStatus?.toLowerCase() || ""

    if (orderStatus !== allowedStatus) {
      return Response.json({
        success: false,
        error: `Order status must be '${campaign.allowedOrderStatus}', current: '${order.displayFinancialStatus}'`
      }, { status: 400 })
    }

    // 检查订单金额
    const orderAmount = parseFloat(order.totalPriceSet.shopMoney.amount)
    if (campaign.minOrderAmount && orderAmount < campaign.minOrderAmount) {
      return Response.json({
        success: false,
        error: `Order amount (${orderAmount}) is below minimum requirement (${campaign.minOrderAmount})`
      }, { status: 400 })
    }

    // 检查客户参与次数限制
    if (campaign.maxPlaysPerCustomer && order.customer) {
      const customerPlays = await prisma.lotteryEntry.count({
        where: {
          campaignId: campaign.id,
          customerId: order.customer.id
        }
      })

      if (customerPlays >= campaign.maxPlaysPerCustomer) {
        return Response.json({
          success: false,
          error: `Maximum plays per customer (${campaign.maxPlaysPerCustomer}) reached`
        }, { status: 400 })
      }
    }
  } else {
    console.log("🔓 暗门：跳过订单状态、金额和客户参与次数检查")
  }

  // 计算订单金额（暗门情况下使用假订单的金额）
  const orderAmount = parseFloat(order.totalPriceSet.shopMoney.amount)

  // 执行抽奖并返回索引
  return await performLottery(campaign, {
    campaignType: "order",
    orderId: finalOrderId,
    orderNumber: order.name,
    orderAmount,
    customerName: order.customer?.displayName,
    customerId: order.customer?.id,
    phone: order.customer?.phone,
    userId
  })
}

// 邮件表单抽奖
async function handleEmailFormLottery(campaign: any, data: PlayLotteryRequest, userId: string) {
  const { email, name, phone } = data

  // 验证必填字段
  if (!email) {
    return Response.json({ success: false, error: "Email is required" }, { status: 400 })
  }

  if (campaign.requireName && !name) {
    return Response.json({ success: false, error: "Name is required" }, { status: 400 })
  }

  if (campaign.requirePhone && !phone) {
    return Response.json({ success: false, error: "Phone is required" }, { status: 400 })
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
      return Response.json({
        success: false,
        error: `Maximum plays per customer (${campaign.maxPlaysPerCustomer}) reached`
      }, { status: 400 })
    }
  }

  // 执行抽奖
  return await performLottery(campaign, {
    campaignType: "email_subscribe",
    order: email, // 将 email 存储到 order 字段
    customerName: name,
    phone,
    userId
  })
}

// 执行抽奖核心逻辑
async function performLottery(campaign: any, entryData: any) {
  // 1. 抽奖算法选择奖品
  const selectedPrize = selectPrize(campaign.Prize)

  if (!selectedPrize) {
    return Response.json({ success: false, error: "No prizes available" }, { status: 400 })
  }

  const isWinner = selectedPrize.type !== "no_prize"

  // 2. 生成折扣码（如果中奖）
  let discountCode = null
  let discountCodeId = null

  if (isWinner && selectedPrize.type.includes("discount")) {
    discountCode = selectedPrize.discountCode || generateDiscountCode()
    // TODO: 调用 Shopify API 创建折扣码
    // discountCodeId = await createShopifyDiscount(...)
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

  console.log(`✅ Lottery completed: ${result.id}, Winner: ${isWinner}, Prize: ${selectedPrize.name}`)

  // 4. 返回结果（包含奖品 ID，前端根据 ID 查找索引）
  return Response.json({
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
  })
}

