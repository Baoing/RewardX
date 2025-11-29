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
      } as any
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

    // 处理订单号：保留原始格式和清理后的格式
    const trimmedOrderNumber = orderNumber.trim()
    const cleanOrderNumber = trimmedOrderNumber.replace(/^#/, "")
    
    // 确保订单号格式正确（Shopify 订单号通常是数字）
    if (!/^\d+$/.test(cleanOrderNumber)) {
      return Response.json({
        success: false,
        error: "Invalid order number format"
      }, { status: 400 })
    }

    console.log("🔍 查询订单号:", {
      original: orderNumber,
      cleaned: cleanOrderNumber
    })

    // 使用 GraphQL 查询订单（通过订单号）
    // 注意：需要 read_orders 权限（已在 shopify.app.toml 中配置）
    // 先查询订单基本信息（不包含客户信息），避免受保护数据权限问题
    const query = `name:"#${cleanOrderNumber}"`
    console.log("🔍 查询订单号:", query)
    
    let order: any = null
    let orderId: string | null = null

    try {
      // 先查询订单基本信息（不包含客户信息，避免受保护数据权限问题）
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

      // 检查 GraphQL 错误
      if (orderData.errors) {
        console.error("❌ GraphQL 错误:", orderData.errors)
        const errorMessage = orderData.errors[0]?.message || "Failed to query orders"
        
        // 检查是否是受保护数据权限错误
        if (errorMessage.includes("not approved to access") || errorMessage.includes("protected-customer-data")) {
          return Response.json({
            success: false,
            error: "This app is not approved to access the Order object. Please apply for Protected Customer Data access in the Shopify Partner Dashboard. See https://shopify.dev/docs/apps/launch/protected-customer-data for more details."
          }, { status: 403 })
        }
        
        // 如果是权限错误，提供更清晰的提示
        if (errorMessage.includes("Access denied") || errorMessage.includes("permission")) {
          return Response.json({
            success: false,
            error: "Access denied. Please ensure the app has 'read_orders' permission. You may need to reinstall the app or update permissions in the Shopify Partner Dashboard."
          }, { status: 403 })
        }
        
        return Response.json({
          success: false,
          error: errorMessage
        }, { status: 400 })
      }

      const orders = orderData.data?.orders?.edges || []
      if (orders.length === 0) {
        return Response.json({
          success: false,
          error: `Order not found: ${trimmedOrderNumber}`
        }, { status: 404 })
      }

      order = orders[0].node
      orderId = order.id
      console.log("✅ 找到订单:", order.name)

      // 尝试获取客户信息（如果应用有权限）
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
            variables: { id: orderId }
          }
        )
        
        const customerData: any = await customerResponse.json()
        if (!customerData.errors && customerData.data?.order?.customer) {
          order.customer = customerData.data.order.customer
        } else {
          order.customer = null
        }
      } catch (customerError) {
        console.warn("⚠️ 无法获取客户信息（可能需要受保护数据权限）")
        order.customer = null
      }
    } catch (error: any) {
      console.error("❌ 查询失败:", error)
      const errorMessage = error?.message || String(error)
      
      if (errorMessage.includes("not approved to access") || errorMessage.includes("protected-customer-data")) {
        return Response.json({
          success: false,
          error: "This app is not approved to access the Order object. Please apply for Protected Customer Data access in the Shopify Partner Dashboard. See https://shopify.dev/docs/apps/launch/protected-customer-data for more details."
        }, { status: 403 })
      }
      
      return Response.json({
        success: false,
        error: `Failed to query order: ${errorMessage}`
      }, { status: 500 })
    }

    // 检查是否找到订单
    if (!order || !orderId) {
      return Response.json({
        success: false,
        error: `Order not found: ${trimmedOrderNumber}`
      }, { status: 404 })
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
        discountCode: existingEntry.discountCode,
        createdAt: existingEntry.createdAt
      })
    }

    // 检查订单状态（统一转换为小写比较，避免大小写不匹配）
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

    // 通过所有验证
    return Response.json({
      success: true,
      canPlay: true,
      order: {
        id: order.id,
        number: order.name,
        amount: orderAmount,
        status: order.displayFinancialStatus,
        customer: order.customer ? {
          id: order.customer.id,
          name: order.customer.displayName,
          phone: order.customer.phone
        } : null
      }
    })
  } catch (error) {
    console.error("❌ 验证订单失败:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify order"
    }, { status: 500 })
  }
}
