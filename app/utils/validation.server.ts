/**
 * 服务端验证工具
 * 提供通用的数据验证逻辑
 */

// ============ Campaign 验证 ============

interface Prize {
  chancePercentage: number
  [key: string]: unknown
}

interface CampaignData {
  name?: string
  startAt?: string | Date
  endAt?: string | Date
  prizes?: Prize[]
}

/**
 * 验证活动名称
 */
export const validateCampaignName = (name: unknown): void => {
  if (!name || typeof name !== "string") {
    throw new Error("VALIDATION_Campaign name is required")
  }

  if (name.trim().length === 0) {
    throw new Error("VALIDATION_Campaign name cannot be empty")
  }

  if (name.length > 100) {
    throw new Error("VALIDATION_Campaign name cannot exceed 100 characters")
  }
}

/**
 * 验证奖品概率总和
 */
export const validatePrizeProbability = (prizes: Prize[]): void => {
  if (!prizes || prizes.length === 0) {
    return
  }

  const totalChance = prizes.reduce((sum, p) => sum + (p.chancePercentage || 0), 0)

  if (Math.abs(totalChance - 100) > 0.01) {
    throw new Error(
      `VALIDATION_Total prize probability must equal 100%, current: ${totalChance.toFixed(2)}%`
    )
  }
}

/**
 * 验证时间范围
 */
export const validateDateRange = (startAt?: string | Date, endAt?: string | Date): void => {
  if (!startAt || !endAt) {
    return
  }

  const start = typeof startAt === "string" ? new Date(startAt) : startAt
  const end = typeof endAt === "string" ? new Date(endAt) : endAt

  if (isNaN(start.getTime())) {
    throw new Error("VALIDATION_Invalid start date")
  }

  if (isNaN(end.getTime())) {
    throw new Error("VALIDATION_Invalid end date")
  }

  if (start >= end) {
    throw new Error("VALIDATION_Start date must be before end date")
  }
}

/**
 * 验证活动数据（创建/更新时使用）
 */
export const validateCampaignData = (data: CampaignData, isCreate: boolean = false): void => {
  // 创建时必须有名称
  if (isCreate) {
    validateCampaignName(data.name)
  }

  // 如果提供了奖品，验证概率
  if (data.prizes && data.prizes.length > 0) {
    validatePrizeProbability(data.prizes)
  }

  // 如果提供了时间范围，验证
  if (data.startAt || data.endAt) {
    validateDateRange(data.startAt, data.endAt)
  }
}

// ============ 通用验证 ============

/**
 * 验证必填字段
 */
export const validateRequired = (value: unknown, fieldName: string): void => {
  if (value === null || value === undefined || value === "") {
    throw new Error(`VALIDATION_${fieldName} is required`)
  }
}

/**
 * 验证字符串长度
 */
export const validateLength = (
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): void => {
  if (min !== undefined && value.length < min) {
    throw new Error(`VALIDATION_${fieldName} must be at least ${min} characters`)
  }

  if (max !== undefined && value.length > max) {
    throw new Error(`VALIDATION_${fieldName} cannot exceed ${max} characters`)
  }
}

/**
 * 验证数字范围
 */
export const validateNumberRange = (
  value: number,
  fieldName: string,
  min?: number,
  max?: number
): void => {
  if (min !== undefined && value < min) {
    throw new Error(`VALIDATION_${fieldName} must be at least ${min}`)
  }

  if (max !== undefined && value > max) {
    throw new Error(`VALIDATION_${fieldName} cannot exceed ${max}`)
  }
}

/**
 * 验证枚举值
 */
export const validateEnum = <T extends string>(
  value: string,
  fieldName: string,
  allowedValues: T[]
): void => {
  if (!allowedValues.includes(value as T)) {
    throw new Error(
      `VALIDATION_${fieldName} must be one of: ${allowedValues.join(", ")}`
    )
  }
}

/**
 * 验证 UUID 格式
 */
export const validateUUID = (value: string, fieldName: string = "ID"): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(value)) {
    throw new Error(`VALIDATION_Invalid ${fieldName} format`)
  }
}

/**
 * 验证邮箱格式
 */
export const validateorder = (order: string): void => {
  const orderRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!orderRegex.test(order)) {
    throw new Error("VALIDATION_Invalid order format")
  }
}

