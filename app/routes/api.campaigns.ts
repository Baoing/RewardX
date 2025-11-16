import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"

// GET /api/campaigns - 获取活动列表
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request)
    
    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })
    
    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const type = url.searchParams.get("type")
    const gameType = url.searchParams.get("gameType")
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const where: any = {
      userId: user.id
    }
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }
    
    if (gameType) {
      where.gameType = gameType
    }
    
    // 查询总数
    const total = await prisma.campaign.count({ where })
    
    // 查询活动列表
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        _count: {
          select: {
            prizes: true,
            lotteryEntries: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    })
    
    return Response.json({
      success: true,
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        gameType: c.gameType,
        status: c.status,
        isActive: c.isActive,
        startAt: c.startAt,
        endAt: c.endAt,
        totalPlays: c.totalPlays,
        totalWins: c.totalWins,
        totalOrders: c.totalOrders,
        prizesCount: c._count.prizes,
        entriesCount: c._count.lotteryEntries,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error("❌ Error fetching campaigns:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

