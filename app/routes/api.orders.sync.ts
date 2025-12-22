/**
 * API: 批量同步历史订单
 * 从 Shopify 获取历史订单并同步到数据库
 */

import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"
import { syncOrderToDatabase } from "@/utils/sync-order.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // 验证管理员权限
    const { admin, session } = await authenticate.admin(request)

    if (!session) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // 解析请求参数
    const body = await request.json().catch(() => ({}))
    const limit = Math.min(parseInt(body.limit || "50"), 250) // 最多 250 个订单
    const days = parseInt(body.days || "30") // 默认同步最近 30 天的订单

    console.log(`🔄 开始同步历史订单: shop=${session.shop}, limit=${limit}, days=${days}`)

    // 计算查询日期范围
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
    const query = `created_at:>${sinceDate.toISOString().split("T")[0]}`

    // 从 Shopify 获取订单列表
    let allOrders: any[] = []
    let hasNextPage = true
    let cursor: string | null = null
    let pageCount = 0
    const maxPages = Math.ceil(limit / 50) // 每页最多 50 个订单

    while (hasNextPage && allOrders.length < limit && pageCount < maxPages) {
      const orderResponse = await admin.graphql(
        `#graphql
        query getOrders($query: String!, $first: Int!, $after: String) {
          orders(first: $first, query: $query, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                name
                displayFinancialStatus
                displayFulfillmentStatus
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                customer {
                  id
                  firstName
                  lastName
                  displayName
                }
                lineItems(first: 50) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      originalUnitPriceSet {
                        shopMoney {
                          amount
                        }
                      }
                    }
                  }
                }
                shippingAddress {
                  firstName
                  lastName
                  address1
                  address2
                  city
                  province
                  country
                  zip
                }
                billingAddress {
                  firstName
                  lastName
                  address1
                  address2
                  city
                  province
                  country
                  zip
                }
                createdAt
                updatedAt
              }
            }
          }
        }`,
        {
          variables: {
            query: query,
            first: Math.min(50, limit - allOrders.length),
            after: cursor
          }
        }
      )

      const orderData: any = await orderResponse.json()

      if (orderData.errors) {
        console.error("❌ GraphQL 错误:", orderData.errors)
        return Response.json({
          success: false,
          error: orderData.errors[0]?.message || "Failed to fetch orders"
        }, { status: 400 })
      }

      const orders = orderData.data?.orders?.edges || []
      const pageInfo = orderData.data?.orders?.pageInfo

      // 转换订单格式以匹配 webhook 格式
      const transformedOrders = await Promise.all(orders.map(async (edge: any) => {
        const node = edge.node
        const lineItems = node.lineItems?.edges?.map((item: any) => ({
          id: item.node.id,
          title: item.node.title,
          quantity: item.node.quantity,
          price: item.node.originalUnitPriceSet?.shopMoney?.amount || "0"
        })) || []

        // 尝试获取客户详细信息（包括受保护数据）
        let customerInfo: any = null
        if (node.customer?.id) {
          try {
            const customerResponse = await admin.graphql(
              `#graphql
              query getOrderCustomer($id: ID!) {
                order(id: $id) {
                  customer {
                    id
                    displayName
                    email
                    phone
                  }
                }
              }`,
              {
                variables: { id: node.id }
              }
            )
            const customerData: any = await customerResponse.json()
            
            // 检查是否有错误（特别是受保护数据权限错误）
            if (customerData.errors) {
              const hasProtectedDataError = customerData.errors.some((err: any) => 
                err.message?.includes("not approved") || 
                err.message?.includes("protected-customer-data")
              )
              if (hasProtectedDataError) {
                console.warn(`⚠️ 订单 ${node.name}: 应用没有受保护数据权限，跳过 email/phone 字段`)
              }
            }
            
            if (!customerData.errors && customerData.data?.order?.customer) {
              customerInfo = customerData.data.order.customer
            } else {
              // 使用基本信息（不包含受保护数据）
              customerInfo = {
                id: node.customer.id,
                displayName: node.customer.displayName || `${node.customer.firstName || ""} ${node.customer.lastName || ""}`.trim() || null,
                email: null,
                phone: null
              }
            }
          } catch (customerError) {
            console.warn(`⚠️ 无法获取订单 ${node.name} 的客户详细信息:`, customerError)
            // 使用基本信息
            customerInfo = {
              id: node.customer.id,
              displayName: node.customer.displayName || `${node.customer.firstName || ""} ${node.customer.lastName || ""}`.trim() || null,
              email: null,
              phone: null
            }
          }
        }

        return {
          id: node.id.replace("gid://shopify/Order/", ""),
          name: node.name,
          email: customerInfo?.email || null,
          phone: customerInfo?.phone || null,
          financial_status: node.displayFinancialStatus?.toLowerCase() || null,
          fulfillment_status: node.displayFulfillmentStatus?.toLowerCase() || null,
          total_price: node.totalPriceSet?.shopMoney?.amount || "0",
          currency_code: node.totalPriceSet?.shopMoney?.currencyCode || "USD",
          customer: customerInfo ? {
            id: customerInfo.id?.replace("gid://shopify/Customer/", ""),
            first_name: node.customer?.firstName || null,
            last_name: node.customer?.lastName || null,
            email: customerInfo.email || null,
            phone: customerInfo.phone || null
          } : null,
          line_items: lineItems,
          shipping_address: node.shippingAddress ? {
            first_name: node.shippingAddress.firstName,
            last_name: node.shippingAddress.lastName,
            address1: node.shippingAddress.address1,
            address2: node.shippingAddress.address2,
            city: node.shippingAddress.city,
            province: node.shippingAddress.province,
            country: node.shippingAddress.country,
            zip: node.shippingAddress.zip,
            phone: null // 地址中的 phone 也是受保护数据
          } : null,
          billing_address: node.billingAddress ? {
            first_name: node.billingAddress.firstName,
            last_name: node.billingAddress.lastName,
            address1: node.billingAddress.address1,
            address2: node.billingAddress.address2,
            city: node.billingAddress.city,
            province: node.billingAddress.province,
            country: node.billingAddress.country,
            zip: node.billingAddress.zip,
            phone: null // 地址中的 phone 也是受保护数据
          } : null,
          created_at: node.createdAt,
          updated_at: node.updatedAt
        }
      }))

      allOrders = allOrders.concat(transformedOrders)
      hasNextPage = pageInfo?.hasNextPage || false
      cursor = pageInfo?.endCursor || null
      pageCount++

      console.log(`📦 已获取 ${allOrders.length} 个订单`)
    }

    // 批量同步订单到数据库
    const results = {
      total: allOrders.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ orderId: string; error: string }>
    }

    for (const order of allOrders) {
      try {
        await syncOrderToDatabase({
          order,
          shop: session.shop,
          userId: user.id
        })
        results.success++
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        results.errors.push({
          orderId: String(order.id),
          error: errorMessage
        })
        console.error(`❌ 同步订单失败: ${order.name}`, error)
      }
    }

    console.log(`✅ 订单同步完成: 成功 ${results.success}, 失败 ${results.failed}`)

    return Response.json({
      success: true,
      results: {
        total: results.total,
        success: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 10) // 只返回前 10 个错误
      }
    })
  } catch (error) {
    console.error("❌ 同步订单错误:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 })
  }
}

