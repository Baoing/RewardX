import { PlanType } from "./plans"

/**
 * 功能权限配置
 * 
 * 定义每个功能所需的最低套餐等级
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
 * 套餐等级（用于比较）
 */
const PLAN_LEVELS: Record<PlanType, number> = {
  [PlanType.FREE]: 0,
  [PlanType.STARTER]: 1,
  [PlanType.PROFESSIONAL]: 2,
  [PlanType.ENTERPRISE]: 3
}

/**
 * 功能所需的最低套餐
 */
export const FEATURE_REQUIREMENTS: Record<Feature, PlanType> = {
  // Free 功能
  [Feature.BASIC_TRACKING]: PlanType.FREE,
  [Feature.MANUAL_OPTIMIZATION]: PlanType.FREE,
  [Feature.BASIC_ANALYTICS]: PlanType.FREE,
  
  // Starter 功能
  [Feature.AUTO_META]: PlanType.STARTER,
  [Feature.STRUCTURED_DATA]: PlanType.STARTER,
  [Feature.IMAGE_ALT]: PlanType.STARTER,
  [Feature.SITEMAP]: PlanType.STARTER,
  
  // Professional 功能
  [Feature.AI_SUGGESTIONS]: PlanType.PROFESSIONAL,
  [Feature.BULK_TOOLS]: PlanType.PROFESSIONAL,
  [Feature.ADVANCED_SCHEMA]: PlanType.PROFESSIONAL,
  [Feature.ANALYTICS_INSIGHTS]: PlanType.PROFESSIONAL,
  [Feature.PRIORITY_SUPPORT]: PlanType.PROFESSIONAL,
  
  // Enterprise 功能
  [Feature.UNLIMITED_QUOTA]: PlanType.ENTERPRISE,
  [Feature.CUSTOM_INTEGRATION]: PlanType.ENTERPRISE,
  [Feature.API_ACCESS]: PlanType.ENTERPRISE,
  [Feature.DEDICATED_SUPPORT]: PlanType.ENTERPRISE,
  [Feature.ONBOARDING]: PlanType.ENTERPRISE,
  [Feature.SLA]: PlanType.ENTERPRISE
}

/**
 * 检查用户是否有权限使用某个功能
 * 
 * @param currentPlan 用户当前套餐
 * @param feature 功能标识
 * @returns 是否有权限
 * 
 * @example
 * ```typescript
 * const canUseAI = hasFeatureAccess(currentPlan, Feature.AI_SUGGESTIONS)
 * ```
 */
export function hasFeatureAccess(
  currentPlan: PlanType,
  feature: Feature
): boolean {
  const requiredPlan = FEATURE_REQUIREMENTS[feature]
  const currentLevel = PLAN_LEVELS[currentPlan]
  const requiredLevel = PLAN_LEVELS[requiredPlan]
  
  return currentLevel >= requiredLevel
}

/**
 * 获取功能所需的最低套餐
 * 
 * @param feature 功能标识
 * @returns 所需套餐
 */
export function getRequiredPlan(feature: Feature): PlanType {
  return FEATURE_REQUIREMENTS[feature]
}

/**
 * 检查用户是否至少是某个套餐等级
 * 
 * @param currentPlan 用户当前套餐
 * @param requiredPlan 所需套餐
 * @returns 是否满足要求
 * 
 * @example
 * ```typescript
 * const isProfessionalOrHigher = isPlanOrHigher(currentPlan, PlanType.PROFESSIONAL)
 * ```
 */
export function isPlanOrHigher(
  currentPlan: PlanType,
  requiredPlan: PlanType
): boolean {
  return PLAN_LEVELS[currentPlan] >= PLAN_LEVELS[requiredPlan]
}

/**
 * 获取用户可用的所有功能列表
 * 
 * @param currentPlan 用户当前套餐
 * @returns 可用功能列表
 */
export function getAvailableFeatures(currentPlan: PlanType): Feature[] {
  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([_, requiredPlan]) => isPlanOrHigher(currentPlan, requiredPlan))
    .map(([feature]) => feature as Feature)
}

/**
 * 获取升级到目标套餐后可解锁的新功能
 * 
 * @param currentPlan 当前套餐
 * @param targetPlan 目标套餐
 * @returns 新功能列表
 */
export function getUnlockedFeatures(
  currentPlan: PlanType,
  targetPlan: PlanType
): Feature[] {
  const currentFeatures = getAvailableFeatures(currentPlan)
  const targetFeatures = getAvailableFeatures(targetPlan)
  
  return targetFeatures.filter(feature => !currentFeatures.includes(feature))
}


