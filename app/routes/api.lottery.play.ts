import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"
import { selectPrize, generateDiscountCode, isCampaignValid, calculateExpiresAt } from "@/utils/lottery.server"

interface PlayLotteryRequest {
  campaignId: string
  type: "order" | "email_form"
  // 订单抽奖
  orderId?: string
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
        prizes: {
          where: { isActive: true },
          orderBy: { chancePercentage: "desc" }
        }
      }
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
  const { orderId } = data

  if (!orderId) {
    return Response.json({ success: false, error: "Order ID is required for order lottery" }, { status: 400 })
  }

  // 检查订单是否已经抽过奖
  const existingEntry = await prisma.lotteryEntry.findUnique({
    where: { orderId }
  })

  if (existingEntry) {
    return Response.json({ success: false, error: "Order has already been used" }, { status: 400 })
  }

  // 获取订单信息
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
  const order = orderData.data?.order

  if (!order) {
    return Response.json({ success: false, error: "Order not found" }, { status: 404 })
  }

  // 检查订单状态
  if (order.displayFinancialStatus !== campaign.allowedOrderStatus) {
    return Response.json({ success: false, error: "Order status not allowed" }, { status: 400 })
  }

  // 检查订单金额
  const orderAmount = parseFloat(order.totalPriceSet.shopMoney.amount)
  if (campaign.minOrderAmount && orderAmount < campaign.minOrderAmount) {
    return Response.json({ success: false, error: "Order amount too low" }, { status: 400 })
  }

  // 执行抽奖
  return await performLottery(campaign, {
    campaignType: "order",
    orderId: order.id,
    orderNumber: order.name,
    orderAmount,
    order: order.order,
    customerName: order.customer?.displayName,
    customerId: order.customer?.id,
    phone: order.customer?.phone,
    userId
  })
}

// 邮件表单抽奖
async function handleorderFormLottery(campaign: any, data: PlayLotteryRequest, userId: string) {
  const { order, name, phone } = data

  // 验证必填字段
  if (campaign.requireOrder && !order) {
    return Response.json({ success: false, error: "order is required" }, { status: 400 })
  }

  if (campaign.requireName && !name) {
    return Response.json({ success: false, error: "Name is required" }, { status: 400 })
  }

  if (campaign.requirePhone && !phone) {
    return Response.json({ success: false, error: "Phone is required" }, { status: 400 })
  }

  // 检查参与次数限制
  if (campaign.maxPlaysPerCustomer && order) {
    const existingPlays = await prisma.lotteryEntry.count({
      where: {
        campaignId: campaign.id,
        order
      }
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
    campaignType: "order_form",
    order,
    customerName: name,
    phone,
    userId
  })
}

// 执行抽奖核心逻辑
async function performLottery(campaign: any, entryData: any) {
  // 1. 抽奖算法选择奖品
  const selectedPrize = selectPrize(campaign.prizes)

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
    const entry = await tx.lotteryEntry.create({
      data: {
        campaignId: campaign.id,
        userId: entryData.userId,
        campaignType: entryData.campaignType,
        orderId: entryData.orderId,
        orderNumber: entryData.orderNumber,
        orderAmount: entryData.orderAmount,
        order: entryData.order,
        customerName: entryData.customerName,
        customerId: entryData.customerId,
        phone: entryData.phone,
        prizeId: selectedPrize.id,
        prizeName: selectedPrize.name,
        prizeType: selectedPrize.type,
        prizeValue: selectedPrize.discountValue?.toString(),
        isWinner,
        status: "pending",
        discountCode,
        discountCodeId,
        expiresAt: isWinner ? calculateExpiresAt(30) : null
      }
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

  // 4. 返回结果
  return Response.json({
    success: true,
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

