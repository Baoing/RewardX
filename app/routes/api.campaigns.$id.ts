import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router"
import { authenticate } from "../shopify.server"
import prisma from "../db.server"

// GET /api/campaigns/:id - 获取活动详情
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request)
    const { id } = params
    
    if (!id) {
      return Response.json({ success: false, error: "Campaign ID is required" }, { status: 400 })
    }
    
    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })
    
    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        prizes: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" }
        },
        _count: {
          select: { lotteryEntries: true }
        }
      }
    })
    
    if (!campaign) {
      return Response.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }
    
    // 计算中奖率
    const winRate = campaign.totalPlays > 0 
      ? (campaign.totalWins / campaign.totalPlays) * 100 
      : 0
    
    return Response.json({
      success: true,
      campaign: {
        ...campaign,
        stats: {
          totalPlays: campaign.totalPlays,
          totalWins: campaign.totalWins,
          totalOrders: campaign.totalOrders,
          winRate: Math.round(winRate * 100) / 100,
          totalEntries: campaign._count.lotteryEntries
        }
      }
    })
    
  } catch (error) {
    console.error("❌ Error fetching campaign:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PUT /api/campaigns/:id - 更新活动
export const action = async ({ request, params }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request)
    const { id } = params
    
    if (!id) {
      return Response.json({ success: false, error: "Campaign ID is required" }, { status: 400 })
    }
    
    const method = request.method
    
    if (method === "DELETE") {
      return await handleDelete(session.shop, id)
    }
    
    if (method === "PUT") {
      return await handleUpdate(request, session.shop, id)
    }
    
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 })
    
  } catch (error) {
    console.error("❌ Error in campaign action:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// 更新活动
async function handleUpdate(request: Request, shop: string, campaignId: string) {
  const user = await prisma.user.findUnique({
    where: { shop }
  })
  
  if (!user) {
    return Response.json({ success: false, error: "User not found" }, { status: 404 })
  }
  
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId: user.id
    }
  })
  
  if (!campaign) {
    return Response.json({ success: false, error: "Campaign not found" }, { status: 404 })
  }
  
  const data = await request.json()
  
  // 验证奖品概率总和
  if (data.prizes && data.prizes.length > 0) {
    const totalChance = data.prizes.reduce((sum: number, p: any) => sum + p.chancePercentage, 0)
    if (Math.abs(totalChance - 100) > 0.01) {
      return Response.json({
        success: false,
        error: `Total chance percentage must equal 100%, current: ${totalChance}%`
      }, { status: 400 })
    }
  }
  
  // 验证时间范围
  if (data.startAt && data.endAt) {
    const start = new Date(data.startAt)
    const end = new Date(data.endAt)
    if (start >= end) {
      return Response.json({
        success: false,
        error: "Start date must be before end date"
      }, { status: 400 })
    }
  }
  
  // 更新活动（包括奖品）
  const updated = await prisma.$transaction(async (tx) => {
    // 如果提供了奖品列表，先删除旧奖品
    if (data.prizes) {
      await tx.prize.deleteMany({
        where: { campaignId }
      })
    }
    
    // 更新活动
    const updatedCampaign = await tx.campaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        gameType: data.gameType,
        minOrderAmount: data.minOrderAmount,
        maxPlaysPerCustomer: data.maxPlaysPerCustomer,
        requireEmail: data.requireEmail,
        requireName: data.requireName,
        requirePhone: data.requirePhone,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        status: data.status,
        isActive: data.status === "active",
        prizes: data.prizes ? {
          create: data.prizes.map((prize: any) => ({
            name: prize.name,
            type: prize.type,
            discountValue: prize.discountValue,
            discountCode: prize.discountCode,
            giftProductId: prize.giftProductId,
            giftVariantId: prize.giftVariantId,
            chancePercentage: prize.chancePercentage,
            totalStock: prize.totalStock,
            displayOrder: prize.displayOrder,
            color: prize.color || "#FF6B6B",
            icon: prize.icon,
            isActive: true
          }))
        } : undefined
      },
      include: {
        prizes: {
          orderBy: { displayOrder: "asc" }
        }
      }
    })
    
    return updatedCampaign
  })
  
  console.log("✅ Campaign updated:", campaignId)
  
  return Response.json({
    success: true,
    campaign: updated
  })
}

// 删除活动
async function handleDelete(shop: string, campaignId: string) {
  const user = await prisma.user.findUnique({
    where: { shop }
  })
  
  if (!user) {
    return Response.json({ success: false, error: "User not found" }, { status: 404 })
  }
  
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId: user.id
    }
  })
  
  if (!campaign) {
    return Response.json({ success: false, error: "Campaign not found" }, { status: 404 })
  }
  
  // 删除活动（级联删除奖品和抽奖记录）
  await prisma.campaign.delete({
    where: { id: campaignId }
  })
  
  console.log("✅ Campaign deleted:", campaignId)
  
  return Response.json({
    success: true,
    message: "Campaign deleted successfully"
  })
}

