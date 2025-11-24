import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"

// GET /api/campaigns/:id/analytics - 获取活动统计数据
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

    // 解析查询参数
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // 构建时间范围查询条件
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // 包含结束日期的全天
      dateFilter.lte = end
    }

    const entriesWhere: any = {
      campaignId
    }
    if (Object.keys(dateFilter).length > 0) {
      entriesWhere.createdAt = dateFilter
    }

    // 1. 基础统计
    const totalEntries = await prisma.lotteryEntry.count({
      where: entriesWhere
    })

    const totalWins = await prisma.lotteryEntry.count({
      where: {
        ...entriesWhere,
        isWinner: true
      }
    })

    // 2. UV (Unique Visitors) - 按 order 或 customerId 去重
    const uniqueVisitors = await prisma.lotteryEntry.groupBy({
      by: ["order"],
      where: {
        ...entriesWhere,
        order: { not: null }
      }
    })

    const uniqueVisitorsByCustomer = await prisma.lotteryEntry.groupBy({
      by: ["customerId"],
      where: {
        ...entriesWhere,
        customerId: { not: null },
        order: null
      }
    })

    const uv = uniqueVisitors.length + uniqueVisitorsByCustomer.length

    // 3. PV (Page Views) - 总参与次数
    const pv = totalEntries

    // 4. 按天统计
    const dailyStats = await prisma.$queryRaw<Array<{
      date: Date
      total_entries: bigint
      total_wins: bigint
      unique_visitors: bigint
    }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*)::bigint as total_entries,
        COUNT(CASE WHEN "isWinner" = true THEN 1 END)::bigint as total_wins,
        COUNT(DISTINCT COALESCE("order", "customerId"))::bigint as unique_visitors
      FROM "LotteryEntry"
      WHERE "campaignId" = ${campaignId}
        ${startDate ? prisma.raw(`AND "createdAt" >= ${new Date(startDate).toISOString()}`) : prisma.raw("")}
        ${endDate ? prisma.raw(`AND "createdAt" <= ${new Date(endDate).toISOString()}`) : prisma.raw("")}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    `

    // 5. 按奖品统计
    const prizeStats = await prisma.lotteryEntry.groupBy({
      by: ["prizeId", "prizeName"],
      where: {
        ...entriesWhere,
        isWinner: true,
        prizeId: { not: null }
      },
      _count: {
        prizeId: true
      },
      orderBy: {
        _count: {
          prizeId: "desc"
        }
      }
    })

    // 6. 按活动类型统计
    const typeStats = await prisma.lotteryEntry.groupBy({
      by: ["campaignType"],
      where: entriesWhere,
      _count: {
        campaignType: true
      }
    })

    // 7. 订单统计（仅订单抽奖）
    const orderStats = campaign.type === "order" ? {
      totalOrders: await prisma.lotteryEntry.count({
        where: {
          ...entriesWhere,
          orderId: { not: null }
        }
      }),
      totalOrderAmount: await prisma.lotteryEntry.aggregate({
        where: {
          ...entriesWhere,
          orderId: { not: null }
        },
        _sum: {
          orderAmount: true
        }
      })
    } : null

    // 8. 邮件收集统计
    const emailStats = {
      totalEmails: await prisma.lotteryEntry.count({
        where: {
          ...entriesWhere,
          email: { not: null }
        }
      }),
      uniqueEmails: uniqueVisitors.length
    }

    // 9. 转化率计算
    const winRate = pv > 0 ? (totalWins / pv) * 100 : 0
    const avgOrderAmount = orderStats?.totalOrderAmount._sum.orderAmount
      ? orderStats.totalOrderAmount._sum.orderAmount / (orderStats.totalOrders || 1)
      : 0

    // 返回统计数据
    return Response.json({
      success: true,
      analytics: {
        // 概览
        overview: {
          pv,                                  // 总浏览量（总参与次数）
          uv,                                  // 独立访客数
          totalEntries: totalEntries,          // 总抽奖次数
          totalWins,                           // 总中奖次数
          winRate: Math.round(winRate * 100) / 100,  // 中奖率
        },

        // 按天统计
        daily: dailyStats.map(d => ({
          date: d.date,
          pv: Number(d.total_entries),
          uv: Number(d.unique_visitors),
          entries: Number(d.total_entries),
          wins: Number(d.total_wins),
          winRate: Number(d.total_entries) > 0
            ? Math.round((Number(d.total_wins) / Number(d.total_entries)) * 10000) / 100
            : 0
        })),

        // 按奖品统计
        prizes: prizeStats.map(p => ({
          prizeId: p.prizeId,
          prizeName: p.prizeName,
          count: p._count.prizeId,
          percentage: pv > 0
            ? Math.round((p._count.prizeId / pv) * 10000) / 100
            : 0
        })),

        // 按类型统计
        types: typeStats.map(t => ({
          type: t.campaignType,
          count: t._count.campaignType
        })),

        // 订单统计
        orders: orderStats ? {
          totalOrders: orderStats.totalOrders,
          totalAmount: orderStats.totalOrderAmount._sum.orderAmount || 0,
          avgAmount: Math.round(avgOrderAmount * 100) / 100
        } : null,

        // 邮件统计
        emails: emailStats,

        // 时间范围
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    })

  } catch (error) {
    console.error("❌ Error fetching analytics:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

