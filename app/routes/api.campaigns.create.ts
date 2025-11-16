import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "../shopify.server"
import prisma from "../db.server"

interface CreateCampaignRequest {
  name: string
  description?: string
  type: "order" | "email_form" | "share"
  gameType: "wheel" | "ninebox" | "slot"
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  requireEmail?: boolean
  requireName?: boolean
  requirePhone?: boolean
  startAt?: string
  endAt?: string
  prizes?: Array<{
    name: string
    type: string
    discountValue?: number
    discountCode?: string
    giftProductId?: string
    giftVariantId?: string
    chancePercentage: number
    totalStock?: number
    displayOrder: number
    color?: string
    icon?: string
  }>
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request)
    
    // 获取用户
    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })
    
    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    const data: CreateCampaignRequest = await request.json()
    
    // 验证必填字段
    if (!data.name) {
      return Response.json({ success: false, error: "Name is required" }, { status: 400 })
    }
    
    // 验证奖品概率总和
    if (data.prizes && data.prizes.length > 0) {
      const totalChance = data.prizes.reduce((sum, p) => sum + p.chancePercentage, 0)
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
    
    // 创建活动
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description,
        type: data.type || "order",
        gameType: data.gameType || "ninebox",
        minOrderAmount: data.minOrderAmount,
        allowedOrderStatus: "paid",
        maxPlaysPerCustomer: data.maxPlaysPerCustomer,
        requireEmail: data.requireEmail ?? true,
        requireName: data.requireName ?? false,
        requirePhone: data.requirePhone ?? false,
        startAt: data.startAt ? new Date(data.startAt) : null,
        endAt: data.endAt ? new Date(data.endAt) : null,
        status: "draft",
        isActive: false,
        prizes: data.prizes ? {
          create: data.prizes.map(prize => ({
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
    
    console.log("✅ Campaign created:", campaign.id)
    
    return Response.json({
      success: true,
      campaign
    })
    
  } catch (error) {
    console.error("❌ Error creating campaign:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

