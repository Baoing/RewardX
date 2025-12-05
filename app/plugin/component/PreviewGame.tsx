import { useState } from "react"
import { observer } from "mobx-react-lite"
import { BlockStack, Text, Spinner } from "@shopify/polaris"
import { useCampaignEditorStore } from "@/stores"
import { NineBoxLottery } from "@plugin/main"
import type { Campaign, Prize } from "@plugin/main"
import { getComponentClassName } from "@/utils/className"
import styles from "./PreviewGame.module.scss"

const cn = (name: string) => getComponentClassName("block", name)

interface PreviewGameProps {
  campaign?: Campaign // Storefront 模式：直接传入 campaign
  isAdmin?: boolean // 是否在 Admin 环境中
  onPrizeWon?: (prize: Prize) => void // Storefront 模式：中奖回调
  shop?: string // Shop 域名（已废弃，现在通过 container 自动获取）
  container?: Element | null // 容器元素，用于自动获取 shop 等公共参数
}

/**
 * 活动预览组件
 * 在右侧预览窗口中直接显示九宫格和完整内容，不使用弹窗
 *
 * 支持两种模式：
 * 1. Admin 模式：从 MobX store 获取 campaign（不传 campaign prop）
 * 2. Storefront 模式：直接接收 campaign 作为 prop
 */
const PreviewGameComponent = ({ campaign: campaignProp, isAdmin = false, onPrizeWon, shop, container }: PreviewGameProps) => {
  // Admin 模式：从 store 获取
  // Storefront 模式：使用传入的 campaign prop
  let campaign: Campaign | null = null

  if (campaignProp) {
    // Storefront 模式：使用传入的 campaign
    campaign = campaignProp
  } else {
    // Admin 模式：从 MobX store 获取
    try {
      const editorStore = useCampaignEditorStore()
      campaign = editorStore.editingCampaign
    } catch (e) {
      // 如果 store 不可用（Storefront 环境），campaign 保持为 null
      console.warn("⚠️ CampaignEditorStore not available, using campaign prop")
    }
  }
  const [orderNumber, setOrderNumber] = useState("")
  const [verified, setVerified] = useState(false)
  const [recentWinner, setRecentWinner] = useState<string | null>(null)

  if (!campaign) {
    return (
      <div className={`${styles.previewGame} ${cn("container")}`}>
        <div className={cn("loading")}>
          <Spinner size="large" />
          <div>
            <Text as="p" tone="subdued">
              Loading...
            </Text>
          </div>
        </div>
      </div>
    )
  }

  // 确保 prizes 存在
  const prizes = campaign.prizes || []
  const content = campaign.content || {}
  const campaignStyles = campaign.styles || {}

  if (prizes.length === 0) {
    return (
      <div className={`${styles.previewGame} ${cn("container")}`}>
        <div className={cn("empty")}>
          <Text as="p" tone="subdued" alignment="center">
            Please add the prize in the Rules tab first.
          </Text>
        </div>
      </div>
    )
  }

  // 动态样式（通过 CSS 变量传递）
  const dynamicStyles = {
    "--title-color": campaignStyles.titleColor,
    "--main-color": campaignStyles.mainTextColor,

    // 整体背景色
    "--bg": campaignStyles.mainBackgroundColor,

    // 抽奖wrapper颜色
    "--wrapper-bg": campaignStyles.moduleContainerBackgroundColor,
    "--border-bg": campaignStyles.moduleBorderColor,
    "--dotted-bg": campaignStyles.moduleDotsColor,

    // 抽奖box颜色
    "--main-bg": campaignStyles.moduleMainBackgroundColor,



    "--button-bg": campaignStyles.moduleButtonColor,

    "--footer-color": campaignStyles.footerTextColor,
    "--lottery-bg": campaignStyles.moduleMainBackgroundColor,
    "--description-color": campaignStyles.mainTextColor
  } as React.CSSProperties

  // 验证状态变化回调
  const handleVerified = (isVerified: boolean) => {
    setVerified(isVerified)
  }

  // 抽奖完成
  const handleComplete = (prize: Prize) => {
    console.log("🎉 中奖:", prize)
    if (onPrizeWon) {
      onPrizeWon(prize)
    }
    if (prize.type !== "no_prize") {
      setRecentWinner(`${prize.name}`)
    }
  }

  // 渲染规则文本
  const renderRules = () => {
    if (!content.rulesText1 && !content.rulesText2) {
      return null
    }

    return (
      <div className={cn("rulesContent")}>
        {content.rulesText1 && (
          <div className={cn("rulesSection")}>
            {content.rulesText1}
          </div>
        )}
        {content.rulesText2 && (
          <div className={cn("rulesSection")}>
            {content.rulesText2}
          </div>
        )}
      </div>
    )
  }

  // 判断是否应该显示内容
  // Admin 环境：始终显示（包括未发布的活动，用于预览）
  // Storefront 环境：只显示已发布的活动
  if (!isAdmin && !campaign.isActive) {
    return null
  }

  return (
    <div
      className={`${styles.container} ${cn("container")}`}
      style={dynamicStyles}
    >
      {/* 自定义 CSS */}
      {campaignStyles.customCSS && <style>{campaignStyles.customCSS}</style>}

      <div className={cn("title-module")}>
        {/* 标题 */}
        {content.title && (
          <h2 className={cn("title")}>
            {content.title}
          </h2>
        )}

        {/* 描述 */}
        {content.description && (
          <p className={cn("description")}>
            {content.description}
          </p>
        )}
      </div>

      <div className={cn("wrapper")}>
        {/* 主内容区 */}
        <div className={cn("main")}>
          {/* 输入框和按钮（在 lotterySection 外面，主内容区中） */}
          <NineBoxLottery
            prizes={prizes}
            campaignStyles={campaignStyles}
            campaignContent={content}
            onComplete={handleComplete}
            campaignId={campaign.id}
            campaignType={campaign.type}
            orderNumber={orderNumber}
            onOrderNumberChange={setOrderNumber}
            onVerified={handleVerified}
            shop={shop}
            container={container}
          />
        </div>

        {/* 底部规则说明 */}
        <div className={cn("rules")}>
          {renderRules()}
        </div>
      </div>
    </div>
  )
}

// 使用 observer 包装以支持 MobX（Admin 模式）
export const PreviewGame = observer(PreviewGameComponent)

export default PreviewGame
