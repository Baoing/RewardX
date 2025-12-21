import type {
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs
} from "react-router"
import {
  Page,
  Layout,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Link
} from "@shopify/polaris"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { boundary } from "@shopify/shopify-app-react-router/server"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ShopInfoCard } from "@/components/ShopInfoCard"
import { UserInfoCard } from "@/components/UserInfoCard"
import { FAQCard } from "@/components/FAQCard"
import { AppEmbedBanner } from "@/components/AppEmbedBanner"
import { SetupGuide, SetupGuideStep } from "@/components/SetupGuide"
import { useUserInfoStore } from "@/stores"

const Index = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userInfoStore = useUserInfoStore()
  const userInfo = userInfoStore.userInfo
  const userName = userInfo?.ownerName || userInfo?.shopName || "User"

  // 新手引导步骤状态（实际项目中应该从 API 或 localStorage 获取）
  const [steps, setSteps] = useState<SetupGuideStep[]>([
    {
      id: "create-campaign",
      title: t("home.guide.step1.title", "创建你的第一个抽奖活动"),
      content: (
        <BlockStack gap="300">
          <Text as="p">
            {t(
              "home.guide.step1.desc",
              "通过创建抽奖活动来吸引和奖励你的客户，提高复购率和客户忠诚度"
            )}
          </Text>
          <InlineStack gap="200">
            <Button variant="primary" fullWidth={false} onClick={() => navigate("/campaigns")}>
              {t("home.guide.step1.action", "创建活动")}
            </Button>
          </InlineStack>
        </BlockStack>
      ),
      mediaNode: (
        <img
          src="https://cdn.parcelpanel.com/front-end/2025/dashboard/add-tracking-page.svg"
          alt="Create Campaign"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      ),
      isCompleted: false
    },
    {
      id: "setup-rewards",
      title: t("home.guide.step2.title", "配置奖品和规则"),
      content: (
        <BlockStack gap="300">
          <Text as="p">
            {t(
              "home.guide.step2.desc",
              "设置吸引人的奖品，包括折扣码、赠品等，并配置抽奖规则"
            )}
          </Text>
          <BlockStack gap="100">
            <Text as="p" tone="subdued">
              • {t("home.guide.step2.item1", "折扣百分比（10% off, 20% off）")}
            </Text>
            <Text as="p" tone="subdued">
              • {t("home.guide.step2.item2", "固定金额折扣（$5 off, $10 off）")}
            </Text>
            <Text as="p" tone="subdued">
              • {t("home.guide.step2.item3", "免费赠品")}
            </Text>
          </BlockStack>
          <Link url="https://docs.example.com/rewards" target="_blank">
            {t("home.guide.step2.link", "了解更多关于奖品配置")}
          </Link>
        </BlockStack>
      ),
      isCompleted: false
    },
    {
      id: "customize-design",
      title: t("home.guide.step3.title", "自定义活动样式"),
      content: (
        <BlockStack gap="300">
          <Text as="p">
            {t(
              "home.guide.step3.desc",
              "让抽奖活动与你的品牌风格保持一致，提升用户体验"
            )}
          </Text>
          <div>
            <Button fullWidth={false} variant={"secondary"}>
              {t("home.guide.step3.action", "去自定义")}
            </Button>
          </div>
        </BlockStack>
      ),
      mediaNode: (
        <img
          src="https://cdn.parcelpanel.com/front-end/2025/dashboard/how-parcelpanel-works.svg"
          alt="Customize Design"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      ),
      isCompleted: false
    },
    {
      id: "publish",
      title: t("home.guide.step4.title", "发布你的活动"),
      content: (
        <BlockStack gap="300">
          <Text as="p">
            {t(
              "home.guide.step4.desc",
              "检查活动配置，确认无误后发布，让客户开始参与抽奖"
            )}
          </Text>
          <div>
          <Button variant="primary" fullWidth={false}>
            {t("home.guide.step4.action", "去发布")}
          </Button>
          </div>
        </BlockStack>
      ),
      isCompleted: false
    }
  ])

  // 是否显示引导（实际项目中应该从用户设置中获取）
  const [guideVisible, setGuideVisible] = useState(true)

  // 切换步骤完成状态
  const handleToggleComplete = useCallback(
    async (stepId: string) => {
      // 模拟 API 调用（实际项目中应该调用真实 API）
      await new Promise(resolve => setTimeout(resolve, 300))

      setSteps(prev =>
        prev.map(step =>
          step.id === stepId
            ? { ...step, isCompleted: !step.isCompleted }
            : step
        )
      )

      console.log(`✅ Step ${stepId} toggled`)
    },
    []
  )

  // 关闭引导
  const handleDismissGuide = useCallback(async () => {
    // 模拟 API 调用（实际项目中应该调用真实 API 保存用户设置）
    await new Promise(resolve => setTimeout(resolve, 300))

    setGuideVisible(false)
    console.log("❌ Setup guide dismissed")
  }, [])

  // 为每个步骤添加 onToggleComplete
  const stepsWithHandlers = steps.map(step => ({
    ...step,
    onToggleComplete: () => handleToggleComplete(step.id)
  }))

  return (
    <Page>
      <BlockStack gap="500">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="200">
            <Text as="h1" variant="headingXl">
              {t("home.welcome", { userName, appName: "RewardX" })}
            </Text>
          </BlockStack>
          <LanguageSwitcher />
        </InlineStack>

        <AppEmbedBanner />

        {/* 新手引导组件 */}
        {guideVisible && (
          <SetupGuide
            title={t("home.guide.title", "快速开始指南")}
            steps={stepsWithHandlers}
            visible={guideVisible}
            onDismiss={handleDismissGuide}
            progressTemplate={t(
              "home.guide.progress",
              "已完成 {completed}/{total} 个步骤"
            )}
            completedText={t(
              "home.guide.completed",
              "🎉 太棒了！你已经完成所有设置步骤"
            )}
          />
        )}

        <FAQCard />
      </BlockStack>
    </Page>
  )
})

export default Index

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs)
}


