/**
 * Webhook: 订单创建和更新
 * 同步 Shopify 订单到数据库，用于 storefront 订单验证
 */

import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // 验证 webhook 请求
    const { payload, session, topic, shop } = await authenticate.webhook(request)

    if (!session) {
      return new Response("Unauthorized", { status: 401 })
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { shop }
    })

    if (!user) {
      return new Response("User not found", { status: 404 })
    }

    // 解析订单数据
    const order = payload as any

    if (!order || !order.id || !order.name) {
      return new Response("Invalid order data", { status: 400 })
    }

    // 提取订单信息
    // Shopify 订单 ID 是数字，需要转换为字符串
    const orderId = String(order.id)
    const orderNumber = order.name // 如 #1001
    const email = order.email || null
    const phone = order.phone || null
    const financialStatus = order.financial_status || null
    const fulfillmentStatus = order.fulfillment_status || null
    const totalPrice = parseFloat(order.total_price || "0")
    const currencyCode = order.currency_code || "USD"

    // 提取客户信息
    const customer = order.customer
    // Shopify 客户 ID 是数字，需要转换为字符串
    const customerId = customer?.id ? String(customer.id) : null
    const customerName = customer ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || null : null
    const customerEmail = customer?.email || email || null
    const customerPhone = customer?.phone || phone || null

    // 提取订单项（简化存储）
    const lineItems = order.line_items ? JSON.stringify(order.line_items.map((item: any) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price
    }))) : "[]"

    // 提取配送地址
    const shippingAddress = order.shipping_address ? JSON.stringify({
      firstName: order.shipping_address.first_name,
      lastName: order.shipping_address.last_name,
      address1: order.shipping_address.address1,
      address2: order.shipping_address.address2,
      city: order.shipping_address.city,
      province: order.shipping_address.province,
      country: order.shipping_address.country,
      zip: order.shipping_address.zip,
      phone: order.shipping_address.phone
    }) : "{}"

    // 提取账单地址
    const billingAddress = order.billing_address ? JSON.stringify({
      firstName: order.billing_address.first_name,
      lastName: order.billing_address.last_name,
      address1: order.billing_address.address1,
      address2: order.billing_address.address2,
      city: order.billing_address.city,
      province: order.billing_address.province,
      country: order.billing_address.country,
      zip: order.billing_address.zip,
      phone: order.billing_address.phone
    }) : "{}"

    // 解析日期
    const createdAt = order.created_at ? new Date(order.created_at) : new Date()
    const updatedAt = order.updated_at ? new Date(order.updated_at) : new Date()

    // 使用 upsert 创建或更新订单
    await prisma.order.upsert({
      where: {
        id: orderId
      },
      create: {
        id: orderId,
        shop: shop,
        userId: user.id,
        orderNumber: orderNumber,
        name: orderNumber,
        email: email,
        phone: phone,
        financialStatus: financialStatus,
        fulfillmentStatus: fulfillmentStatus,
        totalPrice: totalPrice,
        currencyCode: currencyCode,
        customerId: customerId,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        lineItems: lineItems,
        shippingAddress: shippingAddress,
        billingAddress: billingAddress,
        createdAt: createdAt,
        updatedAt: updatedAt,
        syncedAt: new Date()
      },
      update: {
        orderNumber: orderNumber,
        name: orderNumber,
        email: email,
        phone: phone,
        financialStatus: financialStatus,
        fulfillmentStatus: fulfillmentStatus,
        totalPrice: totalPrice,
        currencyCode: currencyCode,
        customerId: customerId,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        lineItems: lineItems,
        shippingAddress: shippingAddress,
        billingAddress: billingAddress,
        updatedAt: updatedAt,
        syncedAt: new Date()
      }
    })

    return new Response(null, { status: 200 })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

