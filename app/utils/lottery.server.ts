/**
 * 抽奖相关工具函数
 */

import type { Prize } from "@prisma/client"

/**
 * 抽奖算法 - 根据概率选择奖品
 */
export function selectPrize(prizes: Prize[]): Prize | null {
  if (prizes.length === 0) {
    return null
  }

  // 1. 过滤掉库存不足的奖品
  const availablePrizes = prizes.filter(prize => {
    if (!prize.totalStock) return true // 无限库存
    return prize.usedStock < prize.totalStock
  })

  if (availablePrizes.length === 0) {
    return null
  }

  // 2. 生成 0-100 的随机数
  const random = Math.random() * 100

  // 3. 累加概率，找到中奖奖品
  let cumulative = 0
  for (const prize of availablePrizes) {
    cumulative += prize.chancePercentage
    if (random <= cumulative) {
      return prize
    }
  }

  // 4. 如果没有中奖，返回"未中奖"奖品
  return availablePrizes.find(p => p.type === "no_prize") || availablePrizes[availablePrizes.length - 1]
}

/**
 * 生成唯一的折扣码
 */
export function generateDiscountCode(prefix: string = "LOTTERY"): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/**
 * 验证活动是否有效
 */
export function isCampaignValid(campaign: {
  status: string
  isActive: boolean
  startAt: Date | null
  endAt: Date | null
}): { valid: boolean; reason?: string } {
  // 检查状态
  if (!campaign.isActive) {
    return { valid: false, reason: "Campaign is not active" }
  }

  // 检查时间范围
  const now = new Date()
  if (campaign.startAt && now < campaign.startAt) {
    return { valid: false, reason: "Campaign has not started yet" }
  }

  if (campaign.endAt && now > campaign.endAt) {
    return { valid: false, reason: "Campaign has ended" }
  }

  return { valid: true }
}

/**
 * 计算折扣码过期时间（默认 30 天）
 */
export function calculateExpiresAt(days: number = 30): Date {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)
  return expiresAt
}

