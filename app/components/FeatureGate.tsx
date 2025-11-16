import { ReactNode } from "react"
import { Banner, Button, BlockStack, Text, InlineStack, Badge } from "@shopify/polaris"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { Feature } from "../config/permissions"
import { PlanType } from "../config/plans"
import { usePermission } from "../hooks/usePermission"

type FeatureGateProps = {
  feature: Feature
  children: ReactNode
  fallback?: ReactNode
  showUpgradeBanner?: boolean
}

/**
 * 功能权限门控组件
 * 
 * 根据用户套餐自动显示/隐藏功能
 * 
 * @example
 * ```typescript
 * <FeatureGate feature={Feature.AI_SUGGESTIONS}>
 *   <Button>AI 优化建议</Button>
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradeBanner = false
}: FeatureGateProps) {
  const { hasAccess, getFeatureRequirement } = usePermission()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const hasPermission = hasAccess(feature)
  const requiredPlan = getFeatureRequirement(feature)

  // 有权限：直接显示功能
  if (hasPermission) {
    return <>{children}</>
  }

  // 无权限：显示降级提示或自定义 fallback
  if (showUpgradeBanner) {
    return (
      <BlockStack gap="400">
        <Banner
          tone="info"
          title={t("permissions.upgradeRequired")}
          action={{
            content: t("permissions.upgradePlan"),
            onAction: () => navigate("/billing")
          }}
        >
          <Text as="p">
            {t("permissions.featureRequiresPlan", {
              feature: t(`features.${feature}`),
              plan: t(`billing.plans.${requiredPlan}.name`)
            })}
          </Text>
        </Banner>
        {fallback}
      </BlockStack>
    )
  }

  // 默认：显示 fallback 或 null
  return <>{fallback || null}</>
}

type RestrictedButtonProps = {
  feature: Feature
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: "primary" | "secondary" | "plain" | "tertiary"
  size?: "micro" | "slim" | "medium" | "large"
  fullWidth?: boolean
  showBadge?: boolean
}

/**
 * 受限按钮组件
 * 
 * 根据权限自动禁用按钮并显示徽章
 * 
 * @example
 * ```typescript
 * <RestrictedButton
 *   feature={Feature.AI_SUGGESTIONS}
 *   onClick={handleAIOptimize}
 * >
 *   AI 优化
 * </RestrictedButton>
 * ```
 */
export function RestrictedButton({
  feature,
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  showBadge = true
}: RestrictedButtonProps) {
  const { hasAccess, getFeatureRequirement } = usePermission()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const hasPermission = hasAccess(feature)
  const requiredPlan = getFeatureRequirement(feature)

  const handleClick = () => {
    if (!hasPermission) {
      // 无权限：跳转到套餐页面
      navigate("/billing")
    } else if (onClick) {
      // 有权限：执行原始点击事件
      onClick()
    }
  }

  return (
    <InlineStack gap="200" blockAlign="center">
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        loading={loading}
        onClick={handleClick}
      >
        {children}
      </Button>
      {!hasPermission && showBadge && (
        <Badge tone="info">
          {t(`billing.plans.${requiredPlan}.name`)}
        </Badge>
      )}
    </InlineStack>
  )
}

type PlanBadgeProps = {
  plan: PlanType
  size?: "small" | "medium"
}

/**
 * 套餐徽章组件
 * 
 * 显示功能所需的套餐等级
 */
export function PlanBadge({ plan, size = "medium" }: PlanBadgeProps) {
  const { t } = useTranslation()

  const toneMap: Record<PlanType, "info" | "success" | "warning" | "attention"> = {
    [PlanType.FREE]: "info",
    [PlanType.STARTER]: "info",
    [PlanType.PROFESSIONAL]: "success",
    [PlanType.ENTERPRISE]: "attention"
  }

  return (
    <Badge tone={toneMap[plan]} size={size}>
      {t(`billing.plans.${plan}.name`)}
    </Badge>
  )
}


