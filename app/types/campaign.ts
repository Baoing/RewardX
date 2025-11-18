/**
 * Campaign 相关的共享类型定义
 */

// ============ 奖品类型 ============

export interface Prize {
  id?: string
  name: string
  description?: string
  type: "discount_percentage" | "discount_fixed" | "free_gift" | "no_prize"
  discountValue?: number
  discountCode?: string
  giftProductId?: string
  giftVariantId?: string
  chancePercentage: number
  totalStock?: number | null
  usedStock?: number
  displayOrder: number
  color?: string
  icon?: string
  isActive?: boolean
}

// ============ 活动类型 ============

export interface Campaign {
  id: string
  userId: string
  name: string
  description?: string
  type: string
  gameType: string
  minOrderAmount?: number
  allowedOrderStatus: string
  requireEmail: boolean
  requireName: boolean
  requirePhone: boolean
  maxPlaysPerCustomer?: number
  startAt?: string
  endAt?: string
  isActive: boolean  // ✅ 只保留 isActive 标记是否发布
  gameConfig: string
  totalPlays: number
  totalWins: number
  totalOrders: number
  createdAt: string
  updatedAt: string
  prizes?: Prize[]
}

// ============ 创建活动请求 ============

export interface CreateCampaignRequest {
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
  prizes?: Prize[]
}

// ============ 更新活动请求 ============

export interface UpdateCampaignRequest {
  name?: string
  description?: string
  isActive?: boolean  // ✅ 只保留 isActive
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  startAt?: string
  endAt?: string
}

// ============ 抽奖记录类型 ============

export interface LotteryEntry {
  id: string
  campaignId: string
  campaignType: string
  orderId?: string
  orderNumber?: string
  orderAmount?: number
  email?: string
  customerName?: string
  phone?: string
  customerId?: string
  prizeId?: string
  prizeName?: string
  prizeType?: string
  prizeValue?: string
  isWinner: boolean
  status: string
  discountCode?: string
  discountCodeId?: string
  claimedAt?: string
  usedOrderId?: string
  usedOrderAmount?: number
  expiresAt?: string
  createdAt: string
}

// ============ 活动分析类型 ============

export interface CampaignAnalytics {
  summary: {
    pv: number
    uv: number
    totalEntries: number
    totalWins: number
    winRate: number
  }
  dailyStats: Array<{
    date: string
    pv: number
    uv: number
    entries: number
    wins: number
  }>
  prizeStats: Array<{
    prizeId: string
    prizeName: string
    totalWins: number
    totalValue: number
  }>
  orderStats: {
    totalOrders: number
    totalAmount: number
    avgAmount: number
  }
}

