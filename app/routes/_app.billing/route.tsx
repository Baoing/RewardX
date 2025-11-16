import {useState} from "react"
import {Badge, BlockStack, Box, Button, Card, Icon, InlineStack, Page, Text} from "@shopify/polaris"
import {CheckIcon} from "@shopify/polaris-icons"
import {useTranslation} from "react-i18next"
import type {LoaderFunctionArgs} from "react-router"
import {useLoaderData} from "react-router"
import {authenticate} from "../../shopify.server"
import {SwitchTab} from "../../components/SwitchTab"
import {DowngradeModal} from "../../components/DowngradeModal"
import {getCurrentSubscription} from "../../services/subscription.server"
import {getAllPlans, PlanConfig, PlanType} from "../../config/plans"
import {showToast, showErrorToast} from "../../utils/toast"
import prisma from "../../db.server"

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {admin, session} = await authenticate.admin(request)

  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: {shop: session.shop}
  })

  if (!user) {
    return {
      currentPlan: PlanType.FREE,
      plans: getAllPlans(),
      hasCompletedSubscription: false,  // 新用户无订阅历史
      isInTrial: false  // 新用户不在试用期
    }
  }

  // 获取当前订阅
  const subscription = await getCurrentSubscription(user.id)

  // 检查是否有已完成的付费订阅历史（排除当前试用中的订阅）
  const completedSubscriptionHistory = await prisma.subscription.findMany({
    where: {
      userId: user.id,
      planType: {
        not: PlanType.FREE  // 排除免费套餐
      },
      OR: [
        { isTrial: false },  // 已付费的订阅
        {
          AND: [
            { isTrial: true },  // 试用期
            { status: { in: ["cancelled", "expired"] } }  // 但已取消或过期
          ]
        }
      ]
    },
    select: {
      id: true,
      planType: true,
      status: true,
      isTrial: true
    }
  })

  // 判断当前是否在试用期内
  const isInTrial = subscription?.isTrial && subscription?.status === "active"

  return {
    currentPlan: subscription?.planType || PlanType.FREE,
    plans: getAllPlans(),
    hasCompletedSubscription: completedSubscriptionHistory.length > 0,  // 是否有已完成的付费订阅
    isInTrial: isInTrial || false  // 是否在试用期内
  }
}

type BillingCycleType = "monthly" | "yearly"

export default function BillingPage() {
  const {t} = useTranslation()
  const {currentPlan, plans, hasCompletedSubscription, isInTrial} = useLoaderData<typeof loader>()
  const [billingCycle, setBillingCycle] = useState<BillingCycleType>("monthly")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)

  const handleSubscribe = async (planKey: string | Blob) => {
    // 如果选择 Free 套餐，显示降级确认弹窗
    if (planKey === PlanType.FREE) {
      setShowDowngradeModal(true)
      return
    }

    setIsSubscribing(true)

    try {
      const formData = new FormData()
      formData.append("plan", planKey)
      formData.append("billingCycle", billingCycle)

      const response = await fetch("/api/subscribe", {
        method: "POST",
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        if (result.confirmationUrl) {
          // 生产模式：跳转到 Shopify 订阅确认页面
          console.log("🔗 跳转到订阅确认页面:", result.confirmationUrl)
          window.top!.location.href = result.confirmationUrl
        } else {
          // 开发模式：直接刷新页面
          console.log("✅ 开发模式：订阅已激活")
          showToast({ content: t("billing.subscriptionSuccess") })
          setTimeout(() => window.location.reload(), 1000)
        }
      } else {
        console.error("❌ 订阅失败:", result.error)
        showErrorToast(t("billing.subscriptionError", { error: result.error }))
      }
    } catch (error) {
      console.error("❌ 请求失败:", error)
      showErrorToast(t("billing.requestError"))
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleDowngradeConfirm = async () => {
    setIsSubscribing(true)

    try {
      console.log("⚠️ 取消当前订阅，切换到免费套餐")

      const response = await fetch("/api/cancel-subscription", {
        method: "POST"
      })

      const result = await response.json()

      if (result.success) {
        console.log("✅ 订阅已取消，刷新页面")
        showToast({ content: t("billing.downgradeSuccess") })
        setTimeout(() => window.location.reload(), 1000)
      } else {
        console.error("❌ 取消订阅失败:", result.error)
        showErrorToast(t("billing.downgradeError", { error: result.error }))
      }
    } catch (error) {
      console.error("❌ 请求失败:", error)
      showErrorToast(t("billing.requestError"))
    } finally {
      setIsSubscribing(false)
      setShowDowngradeModal(false)
    }
  }

  const getPrice = (plan: PlanConfig) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
  }

  const getSavings = (plan: PlanConfig) => {
    if (plan.monthlyPrice === 0 || billingCycle === "monthly") return null

    const monthlyTotal = plan.monthlyPrice * 12
    return ((monthlyTotal - plan.yearlyPrice) / monthlyTotal * 100).toFixed(0)
  }

  /**
   * 获取按钮文案
   * @param plan 套餐配置
   * @param isCurrentPlan 是否是当前套餐
   */
  const getButtonText = (plan: PlanConfig, isCurrentPlan: boolean) => {
    // 当前套餐
    if (isCurrentPlan) {
      return t("billing.currentPlan")
    }

    // Free 套餐：如果当前是付费套餐，显示"取消订阅"的含义
    if (plan.id === PlanType.FREE) {
      if (currentPlan !== PlanType.FREE) {
        // 当前是付费套餐，点击 Free = 取消订阅
        return t("billing.cancelAndSwitchToFree")
      }
      // 当前已经是 Free，显示常规文案
      return t("billing.chooseThisPlan")
    }

    // 付费套餐：根据是否在试用期或有已完成订阅历史决定文案
    if (isInTrial) {
      // 试用期内：可以切换套餐，继续显示试用优惠
      return t("billing.startTrial")
    } else if (hasCompletedSubscription) {
      // 有已完成的订阅历史：不再提供试用期
      return t("billing.chooseThisPlan")
    } else {
      // 首次订阅：提供试用期
      return t("billing.startTrial")
    }
  }

  const billingOptions = [
    { value: "monthly", label: t("billing.payMonthly") },
    { value: "yearly", label: `${t("billing.payYearly")} (${t("billing.savePercent", { percent: "17%" })})` }
  ]

  return (
    <Page title={t("billing.title")} fullWidth>
      <div className="max-w-[1280px] mx-auto">
        <BlockStack gap="600">
          {/* 月付/年付切换 */}
          <InlineStack align="center" blockAlign="center">
            <SwitchTab
              options={billingOptions}
              value={billingCycle}
              onChange={(value: string) => setBillingCycle(value as BillingCycleType)}
            />
          </InlineStack>

          {/* 套餐卡片 - 响应式网格布局 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-[450px]:px-3">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan === plan.id
              const price = getPrice(plan)
              const savings = getSavings(plan)
              const isMostPopular = plan.isPopular

              return (
                <Card key={plan.id}>
                  <BlockStack gap="400">
                    {/* 套餐标题和徽章 */}
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h2" variant="headingMd" fontWeight="semibold">
                          {t(`billing.plans.${plan.id}.name`)}
                        </Text>
                        {isMostPopular && (
                          <Badge tone="success">{t("billing.mostPopular")}</Badge>
                        )}
                      </InlineStack>
                    </BlockStack>

                        {/* 套餐描述 */}
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {t(`billing.plans.${plan.id}.description`)}
                        </Text>

                        {/* 价格 */}
                        <Box paddingBlock="400" borderBlockStartWidth="025" borderBlockEndWidth="025" borderColor="border">
                          <BlockStack gap="100">
                            <InlineStack align="start" blockAlign="center" gap="200">
                              <Text as="p" variant="heading2xl" fontWeight="bold">
                                ${price}
                              </Text>
                              <Text as="p" variant="bodyMd" tone="subdued">
                                /{billingCycle === "monthly" ? t("billing.month") : t("billing.year")}
                              </Text>
                            </InlineStack>
                            {savings && (
                              <Text as="p" variant="bodySm" tone="success">
                                {t("billing.saveAmount", { percent: savings })}
                              </Text>
                            )}
                          </BlockStack>
                        </Box>

                        {/* 配额 */}
                        <Box>
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {plan.quota.toLocaleString()} {t("billing.perMonth")}
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            优化配额
                          </Text>
                        </Box>

                        {/* 订阅按钮 */}
                        <Button
                          variant="primary"
                          size="large"
                          fullWidth
                          disabled={isCurrentPlan || isSubscribing}
                          loading={isSubscribing}
                          onClick={() => handleSubscribe(plan.id)}
                        >
                          {getButtonText(plan, isCurrentPlan)}
                        </Button>

                        {plan.id !== PlanType.FREE && (
                          <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                            {t("billing.additionalQuota")}
                          </Text>
                        )}

                        {/* 功能列表 */}
                        <BlockStack gap="200">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {plan.id === PlanType.FREE
                              ? t("billing.features")
                              : t(`billing.plans.${plan.id}.featuresTitle`)
                            }
                          </Text>
                          <BlockStack gap="200">
                            {plan.features.map((feature, index) => {
                              const isIncluded = true // 所有功能都包含
                              return (
                                <InlineStack key={index} gap="200" blockAlign="start">
                                  <Box>
                                    <Icon
                                      source={CheckIcon}
                                      tone={isIncluded ? "success" : "base"}
                                    />
                                  </Box>
                                  <Text as="p" variant="bodySm">
                                    {t(feature)}
                                  </Text>
                                </InlineStack>
                              )
                            })}
                          </BlockStack>
                        </BlockStack>
                      </BlockStack>
                    </Card>
                  )
                })}
              </div>

          {/* 底部说明 */}
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                {t("billing.needMoreQuota")}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {t("billing.contactUs")}
              </Text>
            </BlockStack>
          </Card>
        </BlockStack>
      </div>

      {/* 降级确认弹窗 */}
      <DowngradeModal
        open={showDowngradeModal}
        currentPlan={currentPlan}
        onConfirm={handleDowngradeConfirm}
        onCancel={() => setShowDowngradeModal(false)}
        loading={isSubscribing}
      />
    </Page>
  )
}

