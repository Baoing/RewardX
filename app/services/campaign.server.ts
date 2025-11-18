/**
 * Campaign 服务
 * 封装 Campaign 相关的业务逻辑
 */

import type { Campaign, Prize, User } from "@prisma/client"
import prisma from "@/db.server"
import { validateCampaignData } from "@/utils/validation.server"

// ============ 类型定义 ============

interface CreateCampaignData {
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
  [key: string]: unknown
}

interface UpdateCampaignData {
  name?: string
  description?: string
  type?: string
  gameType?: string
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  requireEmail?: boolean
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
  }>
  [key: string]: unknown
}

type CampaignWithPrizes = Campaign & {
  prizes?: Prize[]
  _count?: {
    prizes: number
    lotteryEntries: number
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

  return prisma.campaign.findMany({
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
    }
  })
}

/**
 * 根据 ID 获取活动（验证所有权）
 */
export const getCampaignById = async (
  campaignId: string,
  userId: string
): Promise<CampaignWithPrizes | null> => {
  return prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId
    },
    include: {
      prizes: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" }
      },
      _count: {
        select: { 
          prizes: true,
          lotteryEntries: true 
        }
      }
    }
  }) as Promise<CampaignWithPrizes | null>
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
      userId,
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
      isActive: false,  // ✅ 新创建的活动默认为未发布
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
  return campaign
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

    // 更新活动
    return tx.campaign.update({
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
        isActive: data.isActive,  // ✅ 只使用 isActive
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

