import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"

// GET /api/campaigns/:id/entries - 获取抽奖记录列表
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request)
    const { id: campaignId } = params

    if (!campaignId) {
      return Response.json({ success: false, error: "Campaign ID is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // 验证活动所有权
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: user.id
      }
    })

    if (!campaign) {
      return Response.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const isWinner = url.searchParams.get("isWinner")
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "50")

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      campaignId
    }

    if (status && status !== "undefined") {
      where.status = status
    }

    if (isWinner !== null) {
      where.isWinner = isWinner === "true"
    }

    // 查询总数
    const total = await prisma.lotteryEntry.count({ where })

    // 查询记录
    const entries = await prisma.lotteryEntry.findMany({
      where,
      include: {
        Prize: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      } as any,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    })

    return Response.json({
      success: true,
      entries: entries.map(e => ({
        id: e.id,
        campaignType: e.campaignType,
        orderId: e.orderId,
        orderNumber: e.orderNumber,
        orderAmount: e.orderAmount,
        order: e.order, // 用于存储 email（email_subscribe 类型）
        customerName: e.customerName,
        phone: e.phone,
        customerId: e.customerId,
        isWinner: e.isWinner,
        prizeName: e.prizeName,
        prizeType: e.prizeType,
        prizeValue: e.prizeValue,
        discountCode: e.discountCode,
        discountCodeId: e.discountCodeId,
        status: e.status,
        claimedAt: e.claimedAt,
        expiresAt: e.expiresAt,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("❌ Error fetching entries:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

