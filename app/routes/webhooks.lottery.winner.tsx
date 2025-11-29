/**
 * Webhook: 抽奖中奖后自动创建 Draft Order
 * 用于 free_gift 类型奖品自动发货
 */

import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"
import { createDraftOrder } from "@/utils/shopify-draft-order.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // 验证 webhook 请求
    const { admin, session } = await authenticate.admin(request)

    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 })
    }

    const data = await request.json()
    const { entryId, shippingAddress } = data

    if (!entryId) {
      return Response.json({ error: "Entry ID is required" }, { status: 400 })
    }

    // 获取抽奖记录
    const entry = await prisma.lotteryEntry.findUnique({
      where: { id: entryId },
      include: {
        Prize: true,
        Campaign: true
      }
    })

    if (!entry) {
      return Response.json({ error: "Entry not found" }, { status: 404 })
    }

    // 验证是否为免费赠品类型
    if (entry.prizeType !== "free_gift" || !entry.Prize?.giftProductId) {
      return Response.json({
        error: "This entry is not a free gift prize or missing product ID"
      }, { status: 400 })
    }

    // 检查是否已经创建过 Draft Order
    if (entry.usedOrderId) {
      return Response.json({
        error: "Draft Order already created for this entry",
        draftOrderId: entry.usedOrderId
      }, { status: 400 })
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // 创建 Draft Order
    const draftOrder = await createDraftOrder(admin, {
      customerId: entry.customerId || undefined,
      email: entry.order || undefined, // order 字段可能存储了 email
      lineItems: [{
        productId: entry.Prize.giftProductId!,
        variantId: entry.Prize.giftVariantId || undefined,
        quantity: 1
      }],
      shippingAddress: shippingAddress || (entry.customerName ? {
        firstName: entry.customerName.split(" ")[0] || entry.customerName,
        lastName: entry.customerName.split(" ").slice(1).join(" ") || "",
        phone: entry.phone || undefined
      } : undefined),
      note: `Lottery Prize: ${entry.prizeName} - Entry ID: ${entry.id}`,
      tags: ["lottery", "free-gift", `campaign-${entry.campaignId}`]
    })

    // 更新抽奖记录，保存 Draft Order ID
    await prisma.lotteryEntry.update({
      where: { id: entryId },
      data: {
        usedOrderId: draftOrder.draftOrderId,
        status: "claimed"
      }
    })

    console.log("✅ Webhook: Draft Order 创建成功:", {
      entryId,
      draftOrderId: draftOrder.draftOrderId
    })

    return Response.json({
      success: true,
      draftOrderId: draftOrder.draftOrderId,
      invoiceUrl: draftOrder.invoiceUrl
    })
  } catch (error) {
    console.error("❌ Webhook 处理失败:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

