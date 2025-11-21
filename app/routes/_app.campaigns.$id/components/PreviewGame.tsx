import { useState } from "react"
import { observer } from "mobx-react-lite"
import { BlockStack, Text, Spinner } from "@shopify/polaris"
import { useCampaignEditorStore } from "@/stores"
import { NineBoxLottery } from "@plugin/main"
import type { Prize } from "@plugin/main"
import { getComponentClassName } from "@/utils/className"
import styles from "../styles.module.scss"

const cn = (name: string) => getComponentClassName("block", name)

/**
 * 活动预览组件
 * 在右侧预览窗口中直接显示九宫格和完整内容，不使用弹窗
 */
export const PreviewGame = observer(() => {
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
        <div className={cn("loading")} style={{ textAlign: "center", padding: "40px" }}>
          <Spinner size="large" />
          <div style={{ marginTop: "16px" }}>
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

  // 应用样式
  const topBarStyle: React.CSSProperties = {
    backgroundColor: campaignStyles.topBarBackgroundColor || "#ff841f",
    color: campaignStyles.topBarTextColor || "#000000",
    padding: "12px 20px",
    fontSize: "14px",
    textAlign: "center",
    fontWeight: 500,
    borderRadius: "8px 8px 0 0"
  }

  const mainStyle: React.CSSProperties = {
    backgroundColor: campaignStyles.mainBackgroundColor || "#fff",
    color: campaignStyles.mainTextColor || "#000",
    padding: "24px",
    flex: 1
  }

  const buttonStyle: React.CSSProperties = {
    backgroundColor: campaignStyles.moduleButtonColor || "#8B4513",
    color: "#fff",
    border: "none",
    padding: "10px 24px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1
  }

  const footerStyle: React.CSSProperties = {
    backgroundColor: "#8B4513",
    color: campaignStyles.footerTextColor || "#fff",
    padding: "20px 24px",
    fontSize: "13px",
    lineHeight: "1.6",
    borderRadius: "0 0 8px 8px"
  }

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
      <div className={cn("rulesContent")} style={footerStyle}>
        {content.rulesText1 && (
          <div className={cn("rulesSection")} style={{ marginBottom: content.rulesText2 ? "16px" : "0" }}>
            <div style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {content.rulesText1}
            </div>
          </div>
        )}
        {content.rulesText2 && (
          <div className={cn("rulesSection")}>
            <div style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {content.rulesText2}
            </div>
          </div>
        )}
      </div>
    )
  }
  return (
    <div className={`${styles.previewGame} ${cn("container")}`} style={{ backgroundColor: campaignStyles.mainBackgroundColor }}>
      {/* 自定义 CSS */}
      {campaignStyles.customCSS && <style>{campaignStyles.customCSS}</style>}

      <div className={cn("wrapper")} style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: "600px",
        width: "100%",
        margin: "0 auto",
        borderRadius: "8px",
        overflow: "hidden",
      }}>
        {/* 顶部条 - 显示中奖信息 */}
        {recentWinner && (
          <div className={cn("topBar")} style={topBarStyle}>
            {recentWinner} 赢得了"{recentWinner}"奖。
          </div>
        )}

        {/* 主内容区 */}
        <div className={cn("main")} style={mainStyle}>
          {/* 标题 */}
          {content.title && (
            <h2 className={cn("title")} style={{
              fontSize: "24px",
              fontWeight: 600,
              margin: "0 0 8px",
              textAlign: "center"
            }}>
              {content.title}
            </h2>
          )}

          {/* 描述 */}
          {content.description && (
            <p className={cn("description")} style={{
              fontSize: "14px",
              lineHeight: "1.6",
              margin: "0 0 24px",
              textAlign: "center",
              color: campaignStyles.mainTextColor || "#666"
            }}>
              {content.description}
            </p>
          )}

          {/* 订单号验证（仅 order_lottery 类型） */}
          {campaign.type === "order_lottery" && !verified && (
            <div className={cn("verifySection")} style={{ marginBottom: "24px" }}>
              {/* 输入框标题 */}
              {content.inputTitle && (
                <label className={cn("inputLabel")} style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500
                }}>
                  {content.inputTitle}
                </label>
              )}

              {/* 输入框和按钮 */}
              <div className={cn("inputGroup")} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <input
                  type="text"
                  className={cn("input")}
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value)
                    setError("")
                  }}
                  placeholder={content.inputPlaceholder || "请输入您的订单号"}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    border: error ? "1px solid #e74c3c" : "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
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
                  style={buttonStyle}
                >
                  {loading ? "验证中..." : content.buttonText || "加入"}
                </button>
              </div>

              {/* 错误提示 */}
              {error && (
                <p className={cn("error")} style={{
                  color: "#e74c3c",
                  fontSize: "13px",
                  margin: "8px 0 0",
                  minHeight: "20px"
                }}>
                  {error}
                </p>
              )}
            </div>
          )}

          {/* 九宫格抽奖 */}
          {(verified || campaign.type !== "order_lottery") && (
            <div className={cn("lotterySection")} style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "24px 0",
              padding: "20px",
              background: campaignStyles.moduleDrawBackgroundColor || "#1a0202",
              borderRadius: "8px"
            }}>
              <NineBoxLottery
                prizes={prizes}
                campaignStyles={campaignStyles}
                campaignContent={content}
                onComplete={handleComplete}
                disabled={!campaign.isActive}
              />
            </div>
          )}

          {!campaign.isActive && (
            <div className={cn("disabledNotice")}>
              <Text as="p" tone="subdued" alignment="center" variant="bodySm">
                ⚠️ 活动已禁用 - 预览模式
              </Text>
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
