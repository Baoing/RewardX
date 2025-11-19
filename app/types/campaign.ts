/**
 * Campaign 相关的共享类型定义
 */

// ============ 奖品类型 ============

export interface Prize {
  id?: string
  label: string // 奖品标签/名称
  type: "discount_percentage" | "discount_fixed" | "free_shipping" | "free_gift" | "no_prize"
  discountValue?: number // 折扣值
  giftProductId?: string // 赠品产品 ID
  giftVariantId?: string // 赠品变体 ID
  chancePercentage: number // 中奖概率（百分比）
  totalStock?: number | null // 总库存
  usedStock?: number // 已使用库存
  displayOrder?: number // 显示顺序
  image?: string // 奖品图片 URL
  isActive?: boolean
}

// ============ 内容配置类型 ============

export interface CampaignContent {
  title?: string // 板块标题
  description?: string // 描述
  inputTitle?: string // 输入框标题（例如：请输入您的订单号）
  inputPlaceholder?: string // 输入框占位符
  inputEmptyError?: string // 输入为空时的错误提示
  errorMessage?: string // 通用错误消息
  buttonText?: string // 按钮文案
  rulesText1?: string // 规则文本1（多行）
  rulesText2?: string // 规则文本2（多行）
}

// ============ 样式配置类型 ============

export interface CampaignStyles {
  // Main组
  mainTextColor?: string // 主文本颜色
  mainBackgroundColor?: string // 主背景颜色
  
  // TopBar组
  topBarTextColor?: string // 顶部栏文本颜色（默认#000000）
  topBarBackgroundColor?: string // 顶部栏背景颜色（默认#ff841f）
  
  // Module组
  moduleTextColor?: string // 模块文本颜色
  moduleBackgroundColor?: string // 模块背景颜色（默认#ffcfa7）
  moduleBorderColor?: string // 模块边框颜色（默认#ff841f）
  moduleDrawBackgroundColor?: string // 抽奖背景颜色（默认#1a0202）
  moduleButtonColor?: string // 按钮颜色
  
  // Footer
  footerTextColor?: string // 底部文本颜色
  
  // 自定义CSS
  customCSS?: string // 自定义CSS代码
}

// ============ 活动类型 ============

export interface Campaign {
  id: string
  userId: string
  
  // Rules 规则
  name: string // Campaign Name
  type: "order_lottery" | "email_subscribe" // 游戏类型
  gameType: "ninebox" | "wheel" | "slot" | "scratch" // 游戏类型（默认ninebox）
  minOrderAmount?: number // 最低订单金额（仅order_lottery）
  maxPlaysPerCustomer?: number // 每个用户最大游戏次数
  startAt?: string // 开始时间
  endAt?: string // 结束时间
  scheduleType?: "all_time" | "time_period" // 时间规则类型（默认all_time）
  isActive: boolean // 是否发布
  
  // Content 内容
  content?: CampaignContent
  
  // Styles 样式
  styles?: CampaignStyles
  
  // 其他字段
  allowedOrderStatus: string
  requireEmail: boolean
  requireName: boolean
  requirePhone: boolean
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

