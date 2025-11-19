/**
 * SetupGuide 组件使用示例
 *
 * 这个文件展示了如何在 RewardX 项目中使用 SetupGuide 组件
 */

import { Button, Link, Text } from "@shopify/polaris"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { SetupGuide, SetupGuideStep } from "./index"

export const SetupGuideExample = () => {
  const { t } = useTranslation("dashboard")
  const navigate = useNavigate()

  // 模拟步骤完成状态
  const [steps, setSteps] = useState<SetupGuideStep[]>([
    {
      id: "create-campaign",
      title: t("Create your first campaign", "创建你的第一个活动"),
      content: (
        <div className="flex flex-col gap-3">
          <Text as="p">
            {t(
              "Start by creating a lottery campaign to engage your customers",
              "创建一个抽奖活动来吸引你的客户"
            )}
          </Text>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => navigate("/campaigns")}
            >
              {t("Create Campaign", "创建活动")}
            </Button>
            <Button
              onClick={() => handleMarkAsComplete("create-campaign")}
            >
              {t("I've done this", "我已完成")}
            </Button>
          </div>
        </div>
      ),
      mediaNode: (
        <img
          src="https://cdn.example.com/guide-create-campaign.svg"
          alt="Create Campaign"
        />
      ),
      isCompleted: false,
      onToggleComplete: () => handleToggleComplete("create-campaign")
    },
    {
      id: "setup-prizes",
      title: t("Configure prizes", "配置奖品"),
      content: (
        <div className="flex flex-col gap-3">
          <Text as="p">
            {t(
              "Add exciting prizes to your campaign to motivate customers",
              "为你的活动添加吸引人的奖品来激励客户"
            )}
          </Text>
          <ul className="list-disc ml-4">
            <li>
              <Text as="span">
                {t("Discount coupons", "折扣券")}
              </Text>
            </li>
            <li>
              <Text as="span">
                {t("Free shipping", "免运费")}
              </Text>
            </li>
            <li>
              <Text as="span">
                {t("Free gifts", "赠品")}
              </Text>
            </li>
          </ul>
          <Button variant="primary">
            {t("Setup Prizes", "设置奖品")}
          </Button>
        </div>
      ),
      isCompleted: false,
      onToggleComplete: () => handleToggleComplete("setup-prizes")
    },
    {
      id: "customize-design",
      title: t("Customize design", "自定义设计"),
      content: (
        <div className="flex flex-col gap-3">
          <Text as="p">
            {t(
              "Make your campaign match your brand style",
              "让活动匹配你的品牌风格"
            )}
          </Text>
          <Link url="/campaigns/1/styles">
            {t("Customize Styles", "自定义样式")}
          </Link>
        </div>
      ),
      isCompleted: false,
      onToggleComplete: () => handleToggleComplete("customize-design")
    },
    {
      id: "publish",
      title: t("Publish campaign", "发布活动"),
      content: (
        <div className="flex flex-col gap-3">
          <Text as="p">
            {t(
              "Review your campaign and publish it to start attracting customers",
              "检查你的活动并发布它来开始吸引客户"
            )}
          </Text>
          <Button variant="primary">
            {t("Publish Now", "立即发布")}
          </Button>
        </div>
      ),
      isCompleted: false,
      onToggleComplete: () => handleToggleComplete("publish")
    }
  ])

  const [visible, setVisible] = useState(true)

  // 切换完成状态
  const handleToggleComplete = async (stepId: string) => {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 更新本地状态
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, isCompleted: !step.isCompleted }
          : step
      )
    )

    console.log(`✅ Step ${stepId} toggled`)
  }

  // 标记为完成
  const handleMarkAsComplete = async (stepId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))

    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, isCompleted: true } : step
      )
    )

    console.log(`✅ Step ${stepId} completed`)
  }

  // 关闭引导
  const handleDismiss = async () => {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 300))

    setVisible(false)
    console.log("❌ Setup guide dismissed")
  }

  if (!visible) {
    return null
  }

  return (
    <SetupGuide
      title={t("Quick Setup Guide", "快速设置指南")}
      steps={steps}
      visible={visible}
      onDismiss={handleDismiss}
      progressTemplate={t(
        "{completed} of {total} tasks complete",
        "已完成 {completed}/{total} 个任务"
      )}
      completedText={t(
        "🎉 All tasks complete! You're ready to go!",
        "🎉 所有任务已完成！你可以开始了！"
      )}
    />
  )
}

