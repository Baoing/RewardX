import { useState } from "react"
import { observer } from "mobx-react-lite"
import { BlockStack, Text, Spinner } from "@shopify/polaris"
import { useCampaignEditorStore } from "@/stores"
import { NineBoxLottery } from "@plugin/main"
import type { Prize } from "@plugin/main"
import { getComponentClassName } from "@/utils/className"
import styles from "../styles.module.scss"

const cn = (name: string) => getComponentClassName("block", name)

interface PreviewGameProps {
  isAdmin?: boolean // 是否在 Admin 环境中
}

/**
 * 活动预览组件
 * 在右侧预览窗口中直接显示九宫格和完整内容，不使用弹窗
 */
export const PreviewGame = observer(({ isAdmin = false }: PreviewGameProps) => {
  const editorStore = useCampaignEditorStore()
  const campaign = editorStore.editingCampaign
  const [orderNumber, setOrderNumber] = useState("")
  const [error, setError] = useState("")
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentWinner, setRecentWinner] = useState<string | null>(null)

  if (!campaign) {
    return (
      <div className={`${styles.previewGame} ${cn("container")}`}>
        <div className={cn("loading")}>
          <Spinner size="large" />
          <div>
            <Text as="p" tone="subdued">
              加载中...
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
            请先在 Rules 标签页添加奖品
          </Text>
        </div>
      </div>
    )
  }

  // 动态样式（通过 CSS 变量传递）
  const dynamicStyles = {
    "--topBar-bg": campaignStyles.topBarBackgroundColor || "#ff841f",
    "--topBar-color": campaignStyles.topBarTextColor || "#000000",
    "--main-bg": campaignStyles.mainBackgroundColor || "#fff",
    "--main-color": campaignStyles.mainTextColor || "#000",
    "--button-bg": campaignStyles.moduleButtonColor || "#8B4513",
    "--footer-bg": "#8B4513",
    "--footer-color": campaignStyles.footerTextColor || "#fff",
    "--lottery-bg": campaignStyles.moduleDrawBackgroundColor || "#1a0202",
    "--description-color": campaignStyles.mainTextColor || "#666"
  } as React.CSSProperties

  // 验证订单号
  const handleVerify = async () => {
    if (!orderNumber.trim()) {
      setError(content.inputEmptyError || content.inputTitle || "请输入您的订单号")
      return
    }

    setLoading(true)
    setError("")

    try {
      // TODO: 调用后端 API 验证订单号
      await new Promise(resolve => setTimeout(resolve, 1000))
      setVerified(true)
    } catch (err) {
      setError(content.errorMessage || "订单验证失败，请检查订单号是否正确")
    } finally {
      setLoading(false)
    }
  }

  // 抽奖完成
  const handleComplete = (prize: Prize) => {
    console.log("🎉 中奖:", prize)
    if (prize.type !== "no_prize") {
      setRecentWinner(`${prize.label}`)
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
      className={`${styles.previewGame} ${cn("container")}`}
      style={dynamicStyles}
    >
      {/* 自定义 CSS */}
      {campaignStyles.customCSS && <style>{campaignStyles.customCSS}</style>}

      <div className={cn("wrapper")}>
        {/* 顶部条 - 显示中奖信息 */}
        {recentWinner && (
          <div className={cn("topBar")}>
            {recentWinner} 赢得了"{recentWinner}"奖。
          </div>
        )}

        {/* 主内容区 */}
        <div className={cn("main")}>
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

          {/* 订单号验证（仅 order_lottery 类型） */}
          {campaign.type === "order_lottery" && !verified && (
            <div className={cn("verifySection")}>
              {/* 输入框标题 */}
              {content.inputTitle && (
                <label className={cn("inputLabel")}>
                  {content.inputTitle}
                </label>
              )}

              {/* 输入框和按钮 */}
              <div className={cn("inputGroup")}>
                <input
                  type="text"
                  className={`${cn("input")} ${error ? cn("input--error") : ""}`}
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value)
                    setError("")
                  }}
                  placeholder={content.inputPlaceholder}
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleVerify()
                    }
                  }}
                />
                <button
                  className={cn("verifyButton")}
                  onClick={handleVerify}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : content.buttonText}
                </button>
              </div>

              {/* 错误提示 */}
              {error && (
                <p className={cn("error")}>
                  {error}
                </p>
              )}
            </div>
          )}

          {/* 九宫格抽奖 */}
          {(verified || campaign.type !== "order_lottery") && (
            <div className={cn("lotterySection")}>
              <NineBoxLottery
                prizes={prizes}
                campaignStyles={campaignStyles}
                campaignContent={content}
                onComplete={handleComplete}
              />
            </div>
          )}
        </div>

        {/* 底部规则说明 */}
        <div className={cn("rules")}>
          {renderRules()}
        </div>
      </div>
    </div>
  )
})

export default PreviewGame
