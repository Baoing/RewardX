/**
 * Webhook: 订单创建和更新
 * 同步 Shopify 订单到数据库，用于 storefront 订单验证
 */

import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"
import { syncOrderToDatabase } from "@/utils/sync-order.server"

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

    // 使用工具函数同步订单
    await syncOrderToDatabase({
      order,
      shop,
      userId: user.id
    })

    return new Response(null, { status: 200 })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

