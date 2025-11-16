/**
 * 套餐配置枚举和类型定义
 * 集中管理套餐信息，便于维护和扩展
 */

// ============ 套餐枚举 ============

/**
 * 套餐类型枚举（数据库中存储的标识）
 */
export enum PlanType {
  FREE = "free",
  STARTER = "starter",
  PROFESSIONAL = "professional",
  ENTERPRISE = "enterprise"
}

/**
 * 计费周期枚举
 */
export enum BillingCycle {
  MONTHLY = "monthly",
  YEARLY = "yearly"
}

/**
 * 订阅状态枚举
 */
export enum SubscriptionStatus {
  PENDING = "pending",       // 等待支付确认
  ACTIVE = "active",         // 活跃
  CANCELLED = "cancelled",   // 已取消
  EXPIRED = "expired",       // 已过期
  PAST_DUE = "past_due"     // 逾期未付
}

// ============ 套餐配置 ============

/**
 * 套餐配置接口
 */
export interface PlanConfig {
  id: PlanType                    // 套餐唯一标识
  name: string                    // 套餐显示名称（可修改）
  description: string             // 套餐描述
  monthlyPrice: number            // 月费价格
  yearlyPrice: number             // 年费价格
  quota: number                   // 配额限制（-1 表示无限）
  trialDays: number              // 试用天数
  features: string[]             // 功能列表（i18n key）
  isPopular?: boolean            // 是否为热门套餐
  order: number                  // 排序顺序
}

/**
 * 套餐配置映射
 * 套餐名称可以随时修改，但 ID 不变
 */
export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  [PlanType.FREE]: {
    id: PlanType.FREE,
    name: "Free",
    description: "Perfect for testing and small stores",
    monthlyPrice: 0,
    yearlyPrice: 0,
    quota: 20,
    trialDays: 0,
    features: [
      "billing.plans.free.features.basic_tracking",
      "billing.plans.free.features.manual_optimization",
      "billing.plans.free.features.basic_analytics"
    ],
    order: 1
  },
  [PlanType.STARTER]: {
    id: PlanType.STARTER,
    name: "Starter",
    description: "All the basics for starting stores",
    monthlyPrice: 9.9,
    yearlyPrice: 99,
    quota: 100,
    trialDays: 7,
    features: [
      "billing.plans.starter.features.all_free",
      "billing.plans.starter.features.auto_meta",
      "billing.plans.starter.features.structured_data",
      "billing.plans.starter.features.image_alt",
      "billing.plans.starter.features.sitemap"
    ],
    order: 2
  },
  [PlanType.PROFESSIONAL]: {
    id: PlanType.PROFESSIONAL,
    name: "Professional",
    description: "Perfect for growing professional sellers",
    monthlyPrice: 29.9,
    yearlyPrice: 299,
    quota: 500,
    trialDays: 7,
    features: [
      "billing.plans.professional.features.all_starter",
      "billing.plans.professional.features.ai_suggestions",
      "billing.plans.professional.features.bulk_tools",
      "billing.plans.professional.features.advanced_schema",
      "billing.plans.professional.features.analytics_insights",
      "billing.plans.professional.features.priority_support"
    ],
    isPopular: true,
    order: 3
  },
  [PlanType.ENTERPRISE]: {
    id: PlanType.ENTERPRISE,
    name: "Enterprise",
    description: "Designed for large merchants and agencies",
    monthlyPrice: 99.9,
    yearlyPrice: 999,
    quota: 2000,
    trialDays: 14,
    features: [
      "billing.plans.enterprise.features.all_professional",
      "billing.plans.enterprise.features.unlimited_quota",
      "billing.plans.enterprise.features.custom_integration",
      "billing.plans.enterprise.features.api_access",
      "billing.plans.enterprise.features.dedicated_support",
      "billing.plans.enterprise.features.onboarding",
      "billing.plans.enterprise.features.sla"
    ],
    order: 4
  }
}

// ============ 辅助函数 ============

/**
 * 获取套餐配置
 */
export function getPlanConfig(planType: PlanType): PlanConfig {
  return PLAN_CONFIGS[planType]
}

/**
 * 获取套餐价格
 */
export function getPlanPrice(planType: PlanType, cycle: BillingCycle): number {
  const config = getPlanConfig(planType)
  return cycle === BillingCycle.MONTHLY ? config.monthlyPrice : config.yearlyPrice
}

/**
 * 获取所有套餐列表（按顺序）
 */
export function getAllPlans(): PlanConfig[] {
  return Object.values(PLAN_CONFIGS).sort((a, b) => a.order - b.order)
}

/**
 * 验证套餐类型
 */
export function isValidPlanType(value: string): value is PlanType {
  return Object.values(PlanType).includes(value as PlanType)
}

/**
 * 验证计费周期
 */
export function isValidBillingCycle(value: string): value is BillingCycle {
  return Object.values(BillingCycle).includes(value as BillingCycle)
}

/**
 * 计算年付折扣百分比
 */
export function calculateYearlySavings(planType: PlanType): number {
  const config = getPlanConfig(planType)
  if (config.monthlyPrice === 0) return 0
  
  const monthlyTotal = config.monthlyPrice * 12
  const savings = ((monthlyTotal - config.yearlyPrice) / monthlyTotal) * 100
  
  return Math.round(savings)
}

/**
 * 获取套餐显示名称（支持后续本地化）
 */
export function getPlanDisplayName(planType: PlanType, locale?: string): string {
  const config = getPlanConfig(planType)
  // 未来可以扩展为从 i18n 获取翻译后的名称
  return config.name
}

// ============ 功能权限映射 ============

/**
 * 功能标识枚举
 */
export enum Feature {
  // 基础功能
  BASIC_TRACKING = "basic_tracking",
  MANUAL_OPTIMIZATION = "manual_optimization",
  BASIC_ANALYTICS = "basic_analytics",
  
  // Starter 功能
  AUTO_META = "auto_meta",
  STRUCTURED_DATA = "structured_data",
  IMAGE_ALT = "image_alt",
  SITEMAP = "sitemap",
  
  // Professional 功能
  AI_SUGGESTIONS = "ai_suggestions",
  BULK_TOOLS = "bulk_tools",
  ADVANCED_SCHEMA = "advanced_schema",
  ANALYTICS_INSIGHTS = "analytics_insights",
  PRIORITY_SUPPORT = "priority_support",
  
  // Enterprise 功能
  UNLIMITED_QUOTA = "unlimited_quota",
  CUSTOM_INTEGRATION = "custom_integration",
  API_ACCESS = "api_access",
  DEDICATED_SUPPORT = "dedicated_support",
  ONBOARDING = "onboarding",
  SLA = "sla"
}

/**
 * 套餐功能权限映射
 */
export const PLAN_FEATURES: Record<PlanType, Feature[]> = {
  [PlanType.FREE]: [
    Feature.BASIC_TRACKING,
    Feature.MANUAL_OPTIMIZATION,
    Feature.BASIC_ANALYTICS
  ],
  [PlanType.STARTER]: [
    Feature.BASIC_TRACKING,
    Feature.MANUAL_OPTIMIZATION,
    Feature.BASIC_ANALYTICS,
    Feature.AUTO_META,
    Feature.STRUCTURED_DATA,
    Feature.IMAGE_ALT,
    Feature.SITEMAP
  ],
  [PlanType.PROFESSIONAL]: [
    Feature.BASIC_TRACKING,
    Feature.MANUAL_OPTIMIZATION,
    Feature.BASIC_ANALYTICS,
    Feature.AUTO_META,
    Feature.STRUCTURED_DATA,
    Feature.IMAGE_ALT,
    Feature.SITEMAP,
    Feature.AI_SUGGESTIONS,
    Feature.BULK_TOOLS,
    Feature.ADVANCED_SCHEMA,
    Feature.ANALYTICS_INSIGHTS,
    Feature.PRIORITY_SUPPORT
  ],
  [PlanType.ENTERPRISE]: [
    Feature.BASIC_TRACKING,
    Feature.MANUAL_OPTIMIZATION,
    Feature.BASIC_ANALYTICS,
    Feature.AUTO_META,
    Feature.STRUCTURED_DATA,
    Feature.IMAGE_ALT,
    Feature.SITEMAP,
    Feature.AI_SUGGESTIONS,
    Feature.BULK_TOOLS,
    Feature.ADVANCED_SCHEMA,
    Feature.ANALYTICS_INSIGHTS,
    Feature.PRIORITY_SUPPORT,
    Feature.UNLIMITED_QUOTA,
    Feature.CUSTOM_INTEGRATION,
    Feature.API_ACCESS,
    Feature.DEDICATED_SUPPORT,
    Feature.ONBOARDING,
    Feature.SLA
  ]
}

/**
 * 检查套餐是否支持某功能
 */
export function hasFeature(planType: PlanType, feature: Feature): boolean {
  return PLAN_FEATURES[planType].includes(feature)
}

/**
 * 获取套餐的所有功能
 */
export function getPlanFeatures(planType: PlanType): Feature[] {
  return PLAN_FEATURES[planType]
}


