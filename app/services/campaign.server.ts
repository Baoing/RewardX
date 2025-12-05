/**
 * Campaign 服务
 * 封装 Campaign 相关的业务逻辑
 */

import { randomUUID } from "crypto"
import type { Campaign, Prize, User } from "@prisma/client"
import prisma from "@/db.server"
import { validateCampaignData } from "@/utils/validation.server"

// ============ 工具函数 ============

/**
 * 默认内容配置
 * 包含所有 Content 字段的默认值
 */
const getDefaultContent = () => ({
  title: "Win Amazing Prizes!",
  description: "Enter your order number to participate in our exciting lottery and win amazing prizes!",
  inputTitle: "Please enter your order number (e.g., #ORDER123)",
  inputPlaceholder: "Please enter your order number",
  inputEmptyError: "Order number is required",
  errorMessage: "Something went wrong. Please try again.",
  buttonText: "Start",
  rulesText1: "1. Each customer can participate once per order.\n2. Prizes are limited and subject to availability.\n3. Winners will receive their discount codes via email.",
  rulesText2: "4. This promotion is valid for a limited time only.\n5. Terms and conditions apply.\n6. We reserve the right to modify or cancel this promotion at any time."
})

/**
 * 默认样式配置
 * 包含所有可能的颜色字段，即使某些字段可能是 undefined
 */
const getDefaultStyles = () => ({
  // Main Colors (这些字段允许为空，继承主题)
  titleColor: undefined,
  mainTextColor: undefined,
  mainBackgroundColor: undefined,

  // Module Colors (有默认值的字段)
  moduleContainerBackgroundColor: "#FFCFA7",
  moduleBorderColor: "#FF841F",
  moduleDotsColor: "#FFCFA7",
  moduleMainBackgroundColor: "#1A0202",
  moduleCardBackgroundColor: "#FFCFA7",
  moduleButtonColor: "#8B4513",
  buttonColor: "#8B4513", // 兼容字段

  // Footer
  footerTextColor: "#666666",

  // Custom CSS
  customCSS: undefined
})

/**
 * 默认奖品配置（6个奖品）
 */
const getDefaultPrizes = (): Array<{
  name: string
  type: string
  discountValue?: number | null
  discountCode?: string | null
  giftProductId?: string | null
  giftVariantId?: string | null
  chancePercentage: number
  totalStock?: number | null
  displayOrder: number
  image?: string | null
  activeImage?: string | null
}> => [
  {
    name: "10% OFF",
    type: "discount_percentage",
    discountValue: 10,
    discountCode: null,
    giftProductId: null,
    giftVariantId: null,
    chancePercentage: 15,
    totalStock: null,
    displayOrder: 0,
    image: null,
    activeImage: null
  },
  {
    name: "20% OFF",
    type: "discount_percentage",
    discountValue: 20,
    discountCode: null,
    giftProductId: null,
    giftVariantId: null,
    chancePercentage: 10,
    totalStock: null,
    displayOrder: 1,
    image: null,
    activeImage: null
  },
  {
    name: "5% OFF",
    type: "discount_percentage",
    discountValue: 5,
    discountCode: null,
    giftProductId: null,
    giftVariantId: null,
    chancePercentage: 25,
    totalStock: null,
    displayOrder: 2,
    image: null,
    activeImage: null
  },
  {
    name: "Free Shipping",
    type: "free_shipping",
    discountValue: null,
    discountCode: null,
    giftProductId: null,
    giftVariantId: null,
    chancePercentage: 10,
    totalStock: null,
    displayOrder: 3,
    image: null,
    activeImage: null
  },
  {
    name: "Free Gift",
    type: "free_gift",
    discountValue: null,
    discountCode: null,
    giftProductId: null,
    giftVariantId: null,
    chancePercentage: 5,
    totalStock: null,
    displayOrder: 4,
    image: null,
    activeImage: null
  },
  {
    name: "No Luck",
    type: "no_prize",
    discountValue: null,
    discountCode: null,
    giftProductId: null,
    giftVariantId: null,
    chancePercentage: 35,
    totalStock: null,
    displayOrder: 5,
    image: null,
    activeImage: null
  }
]

/**
 * 规范化颜色值（确保是大写格式）
 */
const normalizeColorValue = (value: string | undefined): string | undefined => {
  if (!value || typeof value !== "string") {
    return value
  }
  // 如果值以 # 开头，确保后面的字符是大写
  if (value.startsWith("#")) {
    return `#${value.slice(1).toUpperCase()}`
  }
  // 如果值不以 # 开头，添加 # 并转换为大写
  return `#${value.toUpperCase()}`
}

/**
 * 规范化样式对象中的所有颜色值
 */
const normalizeColorValues = (styles: any): any => {
  if (!styles || typeof styles !== "object") {
    return styles
  }

  const normalized: any = { ...styles }

  // 所有可能的颜色字段
  const colorFields = [
    "titleColor",
    "mainTextColor",
    "mainBackgroundColor",
    "moduleContainerBackgroundColor",
    "moduleBorderColor",
    "moduleDotsColor",
    "moduleMainBackgroundColor",
    "moduleCardBackgroundColor",
    "moduleButtonColor",
    "buttonColor",
    "footerTextColor"
  ]

  // 规范化每个颜色字段
  colorFields.forEach(field => {
    if (normalized[field] !== undefined) {
      normalized[field] = normalizeColorValue(normalized[field])
    }
  })

  return normalized
}

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
    image?: string
    activeImage?: string
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
    image?: string
    activeImage?: string
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
  const defaultContentForList = getDefaultContent()
  const defaultStylesForList = getDefaultStyles()
  return campaigns.map(c => {
    // 解析 gameConfig，提取 content 和 styles
    let content: any = defaultContentForList
    let styles: any = defaultStylesForList

    try {
      const gameConfig = c.gameConfig ? JSON.parse(c.gameConfig) : {}
      // 合并默认内容和数据库中的内容
      content = { ...defaultContentForList, ...(gameConfig.content || {}) }
      // 合并默认样式和数据库中的样式
      styles = { ...defaultStylesForList, ...(gameConfig.styles || {}) }
    } catch (error) {
      console.error("❌ Failed to parse gameConfig:", error)
      content = defaultContentForList
      styles = defaultStylesForList
    }

    // 移除 gameConfig 和 Prize 字段，因为前端只需要解析后的 content 和 styles
    const { gameConfig: _, Prize, ...campaignWithoutGameConfig } = c as any

    return {
      ...campaignWithoutGameConfig,
      prizes: c.Prize || [],
      content,
      styles,
      _count: c._count ? {
        prizes: c._count.Prize || 0,
        lotteryEntries: c._count.LotteryEntry || 0
      } : undefined
    } as CampaignWithPrizes
  })
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
  const defaultContentForGet = getDefaultContent()
  const defaultStylesForGet = getDefaultStyles()
  let content: any = defaultContentForGet
  let styles: any = defaultStylesForGet

  try {
    const gameConfig = campaign.gameConfig ? JSON.parse(campaign.gameConfig) : {}
    // 合并默认内容和数据库中的内容
    content = { ...defaultContentForGet, ...(gameConfig.content || {}) }
    // 合并默认样式和数据库中的样式
    styles = { ...defaultStylesForGet, ...(gameConfig.styles || {}) }
  } catch (error) {
    console.error("❌ Failed to parse gameConfig:", error)
    // 如果解析失败，使用默认值
    content = defaultContentForGet
    styles = defaultStylesForGet
  }

  // 转换字段名以保持前端代码一致性
  // 移除 gameConfig 字段，因为前端只需要解析后的 content 和 styles
  const { gameConfig: _, Prize, ...campaignWithoutGameConfig } = campaign as any

  return {
    ...campaignWithoutGameConfig,
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

  // 获取默认内容、样式（在函数开始时声明一次，后续复用）
  const defaultContent = getDefaultContent()
  const defaultStyles = getDefaultStyles()

  // 构建 gameConfig（包含 content 和 styles）
  // 始终初始化 content 和 styles，即使没有传入也使用默认值
  const gameConfig: any = {
    content: data.content !== undefined
      ? { ...defaultContent, ...data.content }
      : defaultContent,
    styles: data.styles !== undefined
      ? { ...defaultStyles, ...normalizeColorValues(data.styles) }
      : defaultStyles
  }

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
      gameConfig: JSON.stringify(gameConfig),
      updatedAt: new Date(), // 设置更新时间
      Prize: {
        create: (data.prizes && data.prizes.length > 0 ? data.prizes : getDefaultPrizes()).map(prize => ({
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
          image: prize.image ?? null,
          activeImage: prize.activeImage ?? null,
          isActive: true,
          updatedAt: new Date() // 设置更新时间
        }))
      } as any
    } as any,
    include: {
      Prize: {
        orderBy: { displayOrder: "asc" }
      } as any
    } as any
  }) as any

  console.log("✅ Campaign created:", campaign.id)

  // 解析 gameConfig，提取 content 和 styles
  const defaultContentForCreate = getDefaultContent()
  let content: any = defaultContentForCreate
  let styles: any = defaultStyles

  try {
    const parsedGameConfig = campaign.gameConfig ? JSON.parse(campaign.gameConfig) : {}
    // 合并默认内容和数据库中的内容
    content = { ...defaultContentForCreate, ...(parsedGameConfig.content || {}) }
    // 合并默认样式和数据库中的样式
    styles = { ...defaultStyles, ...(parsedGameConfig.styles || {}) }
  } catch (error) {
    console.error("❌ Failed to parse gameConfig after create:", error)
    // 如果解析失败，使用默认值
    content = defaultContentForCreate
    styles = defaultStyles
  }

  // 转换字段名以保持前端代码一致性
  // 移除 gameConfig 字段，因为前端只需要解析后的 content 和 styles
  const { gameConfig: _, Prize, ...campaignWithoutGameConfig } = campaign as any

  return {
    ...campaignWithoutGameConfig,
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

  // 获取默认内容（在函数开始时声明一次，后续复用）
  const defaultContentForUpdate = getDefaultContent()

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
        // 合并默认内容和传入的内容
        gameConfig.content = { ...defaultContentForUpdate, ...data.content }
      }
      if (data.styles !== undefined) {
        // 规范化颜色值（确保是大写格式）
        gameConfig.styles = normalizeColorValues(data.styles)
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
            image: prize.image ?? null,
            activeImage: prize.activeImage ?? null,
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
    const defaultStylesForUpdate = getDefaultStyles()
    let content: any = defaultContentForUpdate
    let styles: any = defaultStylesForUpdate

    try {
      const parsedGameConfig = updated.gameConfig ? JSON.parse(updated.gameConfig) : {}
      // 合并默认内容和数据库中的内容
      content = { ...defaultContentForUpdate, ...(parsedGameConfig.content || {}) }
      // 合并默认样式和数据库中的样式
      styles = { ...defaultStylesForUpdate, ...(parsedGameConfig.styles || {}) }
    } catch (error) {
      console.error("❌ Failed to parse gameConfig after update:", error)
      // 如果解析失败，使用默认值
      content = defaultContentForUpdate
      styles = defaultStylesForUpdate
    }

    // 转换字段名以保持前端代码一致性
    // 移除 gameConfig 字段，因为前端只需要解析后的 content 和 styles
    const { gameConfig: _, Prize, ...updatedWithoutGameConfig } = updated as any

    return {
      ...updatedWithoutGameConfig,
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
