import { useMemo } from "react"
import { useLoaderData } from "react-router"
import { Feature, hasFeatureAccess, isPlanOrHigher, getRequiredPlan } from "../config/permissions"
import { PlanType } from "../config/plans"

/**
 * 权限判断 Hook
 * 
 * 提供便捷的权限检查方法
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { hasAccess, requiresPlan, currentPlan } = usePermission()
 *   
 *   // 检查是否有权限使用某功能
 *   const canUseAI = hasAccess(Feature.AI_SUGGESTIONS)
 *   
 *   // 检查是否至少是 Professional 套餐
 *   const isPro = requiresPlan(PlanType.PROFESSIONAL)
 *   
 *   return (
 *     <Button disabled={!canUseAI}>
 *       AI 优化建议
 *     </Button>
 *   )
 * }
 * ```
 */
export function usePermission() {
  // 从 loader 中获取当前套餐（需要在路由中提供）
  const loaderData = useLoaderData<{ currentPlan?: PlanType }>()
  const currentPlan = loaderData?.currentPlan || PlanType.FREE

  /**
   * 检查是否有权限使用某个功能
   */
  const hasAccess = useMemo(() => {
    return (feature: Feature): boolean => {
      return hasFeatureAccess(currentPlan, feature)
    }
  }, [currentPlan])

  /**
   * 检查是否至少是某个套餐等级
   */
  const requiresPlan = useMemo(() => {
    return (requiredPlan: PlanType): boolean => {
      return isPlanOrHigher(currentPlan, requiredPlan)
    }
  }, [currentPlan])

  /**
   * 获取功能所需的套餐
   */
  const getFeatureRequirement = useMemo(() => {
    return (feature: Feature): PlanType => {
      return getRequiredPlan(feature)
    }
  }, [])

  /**
   * 是否是免费套餐
   */
  const isFree = currentPlan === PlanType.FREE

  /**
   * 是否是 Starter 或更高
   */
  const isStarter = isPlanOrHigher(currentPlan, PlanType.STARTER)

  /**
   * 是否是 Professional 或更高
   */
  const isProfessional = isPlanOrHigher(currentPlan, PlanType.PROFESSIONAL)

  /**
   * 是否是 Enterprise
   */
  const isEnterprise = currentPlan === PlanType.ENTERPRISE

  return {
    currentPlan,
    hasAccess,
    requiresPlan,
    getFeatureRequirement,
    isFree,
    isStarter,
    isProfessional,
    isEnterprise
  }
}


