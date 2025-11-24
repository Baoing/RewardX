import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"
import { isCampaignValid } from "@/utils/lottery.server"

/**
 * POST /api/lottery/verify-order-number
 * 通过订单号验证订单是否可以抽奖（用于 storefront）
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request)
    const data = await request.json()

    const { orderNumber, campaignId } = data

    if (!orderNumber) {
      return Response.json({
        success: false,
        error: "Order number is required"
      }, { status: 400 })
    }

    if (!campaignId) {
      return Response.json({
        success: false,
        error: "Campaign ID is required"
      }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })

    if (!user) {
      return Response.json({
        success: false,
        error: "User not found"
      }, { status: 404 })
    }

    // 获取活动
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: user.id,
        type: "order",
        isActive: true
      },
      include: {
        Prize: {
          where: { isActive: true }
        }
      }
    })

    if (!campaign) {
      return Response.json({
        success: false,
        error: "Campaign not found or not active"
      }, { status: 404 })
    }

    // 验证活动有效性
    const validity = isCampaignValid(campaign)
    if (!validity.valid) {
      return Response.json({
        success: false,
        error: validity.reason
      }, { status: 400 })
    }

    // 通过订单号查找订单（去掉 # 号）
    const cleanOrderNumber = orderNumber.replace(/^#/, "").trim()

    // 使用 GraphQL 查询订单（通过订单号）
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
              order
              customer {
                id
                displayName
                order
                phone
              }
            }
          }
        }
      }`,
      {
        variables: {
          query: `name:${cleanOrderNumber}`
        }
      }
    )

    const orderData = await orderResponse.json()
    const orders = orderData.data?.orders?.edges || []

    if (orders.length === 0) {
      return Response.json({
        success: false,
        error: "Order not found"
      }, { status: 404 })
    }

    const order = orders[0].node
    const orderId = order.id

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

    // 检查订单状态
    if (order.displayFinancialStatus !== campaign.allowedOrderStatus) {
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
    console.error("❌ Error verifying order number:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

