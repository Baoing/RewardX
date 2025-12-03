/**
 * Campaign 服务
 * 封装 Campaign 相关的业务逻辑
 */

import { randomUUID } from "crypto"
import type { Campaign, Prize, User } from "@prisma/client"
import prisma from "@/db.server"
import { validateCampaignData } from "@/utils/validation.server"

// ============ 类型定义 ============

interface CreateCampaignData {
  name: string
  description?: string
  type: "order" | "order_form" | "share"
  gameType: "wheel" | "ninebox" | "slot"
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  requireOrder?: boolean
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
    image?: string
  }>
  [key: string]: unknown
}

interface UpdateCampaignData {
  name?: string
  description?: string
  type?: string
  gameType?: string
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  requireOrder?: boolean
  requireName?: boolean
  requirePhone?: boolean
  startAt?: string
  endAt?: string
  isActive?: boolean  // ✅ 只保留 isActive 字段
  prizes?: Array<{
    name: string
    type: string
    discountValue?: number
    chancePercentage: number
    totalStock?: number
    displayOrder: number
    color?: string
    icon?: string
    image?: string
  }>
  [key: string]: unknown
}

type CampaignWithPrizes = Campaign & {
  Prize?: Prize[]
  _count?: {
    Prize: number
    LotteryEntry: number
  }
}

// ============ 查询方法 ============

/**
 * 获取用户的所有活动
 */
export const getCampaignsByUserId = async (
  userId: string,
  filters?: {
    status?: string
    type?: string
    gameType?: string
  }
): Promise<CampaignWithPrizes[]> => {
  const where: any = { userId }

  if (filters?.status) where.status = filters.status
  if (filters?.type) where.type = filters.type
  if (filters?.gameType) where.gameType = filters.gameType

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      Prize: true,
      _count: {
        select: {
          Prize: true,
          LotteryEntry: true
        } as any
      }
    } as any,
    orderBy: {
      createdAt: "desc"
    }
  }) as any[]

  // 转换字段名以保持前端代码一致性
  return campaigns.map(c => ({
    ...c,
    prizes: c.Prize || [],
    _count: c._count ? {
      prizes: c._count.Prize || 0,
      lotteryEntries: c._count.LotteryEntry || 0
    } : undefined
  })) as CampaignWithPrizes[]
}

/**
 * 根据 ID 获取活动（验证所有权）
 */
export const getCampaignById = async (
  campaignId: string,
  userId: string
): Promise<CampaignWithPrizes | null> => {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId
    },
    include: {
      Prize: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" }
      },
      _count: {
        select: {
          Prize: true,
          LotteryEntry: true
        } as any
      }
    } as any
  }) as any

  if (!campaign) {
    return null
  }

  // 解析 gameConfig JSON 字段，提取 content 和 styles
  let content: any = undefined
  let styles: any = undefined
  
  try {
    const gameConfig = campaign.gameConfig ? JSON.parse(campaign.gameConfig) : {}
    content = gameConfig.content
    styles = gameConfig.styles
  } catch (error) {
    console.error("❌ Failed to parse gameConfig:", error)
    // 如果解析失败，使用空对象
    content = undefined
    styles = undefined
  }

  // 转换字段名以保持前端代码一致性
  return {
    ...campaign,
    prizes: campaign.Prize || [],
    content,
    styles,
    _count: campaign._count ? {
      prizes: campaign._count.Prize || 0,
      lotteryEntries: campaign._count.LotteryEntry || 0
    } : undefined
  } as CampaignWithPrizes
}

/**
 * 验证活动所有权
 */
export const verifyCampaignOwnership = async (
  campaignId: string,
  userId: string
): Promise<Campaign> => {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId
    }
  })

  if (!campaign) {
    throw new Error("CAMPAIGN_NOT_FOUND")
  }

  return campaign
}

// ============ 创建/更新/删除方法 ============

/**
 * 创建活动
 */
export const createCampaign = async (
  userId: string,
  data: CreateCampaignData
): Promise<CampaignWithPrizes> => {
  // 验证数据
  validateCampaignData(data, true)

  // 创建活动
  const campaign = await prisma.campaign.create({
    data: {
      id: randomUUID(), // 生成 UUID
      userId,
      name: data.name,
      description: data.description,
      type: data.type || "order",
      gameType: data.gameType || "ninebox",
      minOrderAmount: data.minOrderAmount,
      allowedOrderStatus: "paid",
      maxPlaysPerCustomer: data.maxPlaysPerCustomer,
      requireOrder: data.requireOrder ?? true,
      requireName: data.requireName ?? false,
      requirePhone: data.requirePhone ?? false,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      isActive: false,  // ✅ 新创建的活动默认为未发布
      updatedAt: new Date(), // 设置更新时间
      Prize: data.prizes ? {
        create: data.prizes.map(prize => ({
          id: randomUUID(), // 生成 UUID
          name: prize.name,
          type: prize.type,
          discountValue: prize.discountValue ?? null,
          discountCode: prize.discountCode ?? null,
          giftProductId: prize.giftProductId ?? null,
          giftVariantId: prize.giftVariantId ?? null,
          chancePercentage: prize.chancePercentage,
          totalStock: prize.totalStock ?? null,
          displayOrder: prize.displayOrder,
          color: prize.color || "#FF6B6B",
          icon: prize.icon ?? null,
          image: prize.image ?? null,
          isActive: true,
          updatedAt: new Date() // 设置更新时间
        }))
      } as any : undefined
    } as any,
    include: {
      Prize: {
        orderBy: { displayOrder: "asc" }
      } as any
    } as any
  }) as any

  console.log("✅ Campaign created:", campaign.id)

  // 转换字段名以保持前端代码一致性
  return {
    ...campaign,
    prizes: campaign.Prize || [],
    _count: campaign._count ? {
      prizes: campaign._count.Prize || 0,
      lotteryEntries: campaign._count.LotteryEntry || 0
    } : undefined
  } as CampaignWithPrizes
}

/**
 * 更新活动
 */
export const updateCampaign = async (
  campaignId: string,
  userId: string,
  data: UpdateCampaignData
): Promise<CampaignWithPrizes> => {
  // 验证所有权
  await verifyCampaignOwnership(campaignId, userId)

  // 验证数据
  validateCampaignData(data, false)

  // 更新活动（使用事务）
  const updated = await prisma.$transaction(async (tx) => {
    // 如果提供了奖品列表，先删除旧奖品
    if (data.prizes) {
      await tx.prize.deleteMany({
        where: { campaignId }
      })
    }

    // 构建更新数据，过滤掉 undefined 字段
    const updateData: any = {}

    // 获取当前活动的 gameConfig（用于合并 content 和 styles）
    const currentCampaign = await tx.campaign.findUnique({
      where: { id: campaignId },
      select: { gameConfig: true }
    })

    // 解析现有的 gameConfig
    let gameConfig: any = {}
    try {
      gameConfig = currentCampaign?.gameConfig ? JSON.parse(currentCampaign.gameConfig) : {}
    } catch (error) {
      console.error("❌ Failed to parse existing gameConfig:", error)
      gameConfig = {}
    }

    // 如果提供了 content 或 styles，合并到 gameConfig 中
    if (data.content !== undefined || data.styles !== undefined) {
      if (data.content !== undefined) {
        gameConfig.content = data.content
      }
      if (data.styles !== undefined) {
        gameConfig.styles = data.styles
      }
      // 将合并后的 gameConfig 序列化回 JSON 字符串
      updateData.gameConfig = JSON.stringify(gameConfig)
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.gameType !== undefined) updateData.gameType = data.gameType
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount
    if (data.maxPlaysPerCustomer !== undefined) updateData.maxPlaysPerCustomer = data.maxPlaysPerCustomer
    if (data.requireOrder !== undefined) updateData.requireOrder = data.requireOrder
    if (data.requireName !== undefined) updateData.requireName = data.requireName
    if (data.requirePhone !== undefined) updateData.requirePhone = data.requirePhone
    if (data.startAt !== undefined) updateData.startAt = data.startAt ? new Date(data.startAt) : null
    if (data.endAt !== undefined) updateData.endAt = data.endAt ? new Date(data.endAt) : null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // 处理奖品（如果提供了）
    if (data.prizes) {
      updateData.Prize = {
        create: data.prizes
          .filter((prize: any) => prize.name && prize.name.trim() !== "") // 过滤掉名称为空的奖品
          .map((prize: any) => ({
            id: randomUUID(), // 生成 UUID
            name: prize.name, // name 是必填字段
            type: prize.type,
            discountValue: prize.discountValue ?? null,
            discountCode: prize.discountCode ?? null,
            giftProductId: prize.giftProductId ?? null,
            giftVariantId: prize.giftVariantId ?? null,
            chancePercentage: prize.chancePercentage ?? 0,
            totalStock: prize.totalStock ?? null,
            displayOrder: prize.displayOrder ?? 0,
            color: prize.color || "#FF6B6B",
            icon: prize.icon ?? null,
            image: prize.image ?? null,
            isActive: true,
            updatedAt: new Date() // 设置更新时间
          }))
      } as any
    }

    // 更新活动
    const updated = await tx.campaign.update({
      where: { id: campaignId },
      data: updateData,
      include: {
        Prize: {
          orderBy: { displayOrder: "asc" }
        } as any
      } as any
    }) as any

    // 解析 gameConfig，提取 content 和 styles
    let content: any = undefined
    let styles: any = undefined
    
    try {
      const parsedGameConfig = updated.gameConfig ? JSON.parse(updated.gameConfig) : {}
      content = parsedGameConfig.content
      styles = parsedGameConfig.styles
    } catch (error) {
      console.error("❌ Failed to parse gameConfig after update:", error)
    }

    // 转换字段名以保持前端代码一致性
    return {
      ...updated,
      prizes: updated.Prize || [],
      content,
      styles,
      _count: updated._count ? {
        prizes: updated._count.Prize || 0,
        lotteryEntries: updated._count.LotteryEntry || 0
      } : undefined
    } as CampaignWithPrizes
  })

  console.log("✅ Campaign updated:", campaignId)
  return updated
}

/**
 * 删除活动
 */
export const deleteCampaign = async (
  campaignId: string,
  userId: string
): Promise<void> => {
  // 验证所有权
  await verifyCampaignOwnership(campaignId, userId)

  // 删除活动（级联删除奖品和抽奖记录）
  await prisma.campaign.delete({
    where: { id: campaignId }
  })

  console.log("✅ Campaign deleted:", campaignId)
}

// ============ 统计方法 ============

/**
 * 获取活动统计信息
 */
export const getCampaignStats = (campaign: Campaign) => {
  const winRate = campaign.totalPlays > 0
    ? (campaign.totalWins / campaign.totalPlays) * 100
    : 0

  return {
    totalPlays: campaign.totalPlays,
    totalWins: campaign.totalWins,
    totalOrders: campaign.totalOrders,
    winRate: Math.round(winRate * 100) / 100
  }
}


