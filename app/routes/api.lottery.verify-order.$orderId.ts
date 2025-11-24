import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"
import { isCampaignValid } from "@/utils/lottery.server"

// GET /api/lottery/verify-order/:orderId - 验证订单是否可以抽奖
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request)
    const { orderId } = params

    if (!orderId) {
      return Response.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // 查找激活的订单抽奖活动
    const campaign = await prisma.campaign.findFirst({
      where: {
        userId: user.id,
        type: "order",
        isActive: true,
        status: "active"
      },
      include: {
        prizes: {
          where: { isActive: true }
        }
      }
    })

    if (!campaign) {
      return Response.json({
        success: true,
        canPlay: false,
        reason: "No active order lottery campaign found"
      })
    }

    // 验证活动有效性
    const validity = isCampaignValid(campaign)
    if (!validity.valid) {
      return Response.json({
        success: true,
        canPlay: false,
        reason: validity.reason
      })
    }

    // 检查订单是否已经抽过奖
    const existingEntry = await prisma.lotteryEntry.findUnique({
      where: { orderId }
    })

    if (existingEntry) {
      return Response.json({
        success: true,
        canPlay: false,
        reason: "Order has already been used for lottery",
        hasPlayed: true,
        previousEntry: {
          id: existingEntry.id,
          isWinner: existingEntry.isWinner,
          prizeName: existingEntry.prizeName,
          discountCode: existingEntry.discountCode,
          createdAt: existingEntry.createdAt
        }
      })
    }

    // 从 Shopify 获取订单信息
    const orderResponse = await admin.graphql(
      `#graphql
      query getOrder($id: ID!) {
        order(id: $id) {
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
          order
          customer {
            id
            displayName
            order
            phone
          }
        }
      }`,
      {
        variables: { id: orderId }
      }
    )

    const orderData = await orderResponse.json()
    const order = orderData.data?.order

    if (!order) {
      return Response.json({
        success: true,
        canPlay: false,
        reason: "Order not found"
      })
    }

    // 检查订单状态
    if (order.displayFinancialStatus !== campaign.allowedOrderStatus) {
      return Response.json({
        success: true,
        canPlay: false,
        reason: `Order status must be '${campaign.allowedOrderStatus}', current: '${order.displayFinancialStatus}'`
      })
    }

    // 检查订单金额
    const orderAmount = parseFloat(order.totalPriceSet.shopMoney.amount)
    if (campaign.minOrderAmount && orderAmount < campaign.minOrderAmount) {
      return Response.json({
        success: true,
        canPlay: false,
        reason: `Order amount (${orderAmount}) is below minimum requirement (${campaign.minOrderAmount})`
      })
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
          success: true,
          canPlay: false,
          reason: `Maximum plays per customer (${campaign.maxPlaysPerCustomer}) reached`
        })
      }
    }

    // 通过所有验证
    return Response.json({
      success: true,
      canPlay: true,
      order: {
        id: order.id,
        number: order.name,
        amount: orderAmount,
        currency: order.totalPriceSet.shopMoney.currencyCode,
        order: order.order || order.customer?.order,
        customerName: order.customer?.displayName,
        customerId: order.customer?.id,
        phone: order.customer?.phone
      },
      campaign: {
        id: campaign.id,
        name: campaign.name,
        gameType: campaign.gameType
      }
    })

  } catch (error) {
    console.error("❌ Error verifying order:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

