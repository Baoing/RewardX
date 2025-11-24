import { useState } from "react"
import { NineBoxLottery } from "./NineBoxLottery"
import type { Campaign, Prize, CampaignContent, CampaignStyles } from "@plugin/main"

interface LotteryModalProps {
  campaign: Campaign
  isAdmin?: boolean // 是否在 Admin 环境中
  onClose?: () => void
  onPrizeWon?: (prize: Prize) => void
}

/**
 * 完整的抽奖弹窗组件
 * 包含顶部条、输入框、九宫格、规则说明等
 */
export const LotteryModal = ({
  campaign,
  isAdmin = false,
  onClose,
  onPrizeWon
}: LotteryModalProps) => {
  const [orderNumber, setOrderNumber] = useState("")
  const [error, setError] = useState("")
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentWinner, setRecentWinner] = useState<string | null>(null)

  const { content = {}, styles = {}, prizes = [], type, isActive } = campaign

  // 判断是否应该显示内容
  // Admin 环境：始终显示（包括未发布的活动，用于预览）
  // Storefront 环境：只显示已发布的活动
  if (!isAdmin && !isActive) {
    return null
  }

  // 应用样式
  const topBarStyle: React.CSSProperties = {
    backgroundColor: styles.topBarBackgroundColor || "#ff841f",
    color: styles.topBarTextColor || "#000000",
    padding: "12px 20px",
    fontSize: "14px",
    textAlign: "center",
    fontWeight: 500
  }

  const mainStyle: React.CSSProperties = {
    backgroundColor: styles.mainBackgroundColor || "#fff",
    color: styles.mainTextColor || "#000",
    padding: "24px",
    minHeight: "500px"
  }

  const buttonStyle: React.CSSProperties = {
    backgroundColor: styles.moduleButtonColor || styles.buttonColor || "#8B4513",
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
    color: styles.footerTextColor || "#fff",
    padding: "20px 24px",
    fontSize: "13px",
    lineHeight: "1.6"
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
      // const response = await fetch(`/api/lottery/verify-order/${orderNumber}`)
      // const data = await response.json()
      
      // 模拟验证
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
    if (onPrizeWon) {
      onPrizeWon(prize)
    }

    // 显示中奖信息（可以显示在顶部条）
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
      <div style={footerStyle}>
        {content.rulesText1 && (
          <div style={{ marginBottom: content.rulesText2 ? "16px" : "0" }}>
            <div style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {content.rulesText1}
            </div>
          </div>
        )}
        {content.rulesText2 && (
          <div>
            <div style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {content.rulesText2}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
        overflow: "auto"
      }}
    >
      {/* 自定义 CSS */}
      {styles.customCSS && <style>{styles.customCSS}</style>}

      {/* 顶部条 - 显示中奖信息 */}
      {recentWinner && (
        <div style={topBarStyle}>
          {recentWinner} 赢得了"{recentWinner}"奖。
        </div>
      )}

      {/* 主内容区 */}
      <div
        style={{
          ...mainStyle,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: "600px",
          width: "100%",
          margin: "0 auto",
          borderRadius: "8px",
          marginTop: "40px",
          marginBottom: "20px"
        }}
      >
        {/* 标题 */}
        {content.title && (
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 600,
              margin: "0 0 12px",
              textAlign: "center"
            }}
          >
            {content.title}
          </h2>
        )}

        {/* 描述 */}
        {content.description && (
          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              margin: "0 0 24px",
              textAlign: "center",
              color: styles.mainTextColor || "#666"
            }}
          >
            {content.description}
          </p>
        )}

        {/* 订单号验证（仅 order_lottery 类型） */}
        {type === "order_lottery" && !verified && (
          <div style={{ marginBottom: "24px" }}>
            {/* 输入框标题 */}
            {content.inputTitle && (
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500
                }}
              >
                {content.inputTitle}
              </label>
            )}

            {/* 输入框和按钮 */}
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <input
                type="text"
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
                onClick={handleVerify}
                disabled={loading}
                style={buttonStyle}
              >
                {loading ? "验证中..." : content.buttonText || "加入"}
              </button>
            </div>

            {/* 错误提示 */}
            {error && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "13px",
                  margin: "8px 0 0",
                  minHeight: "20px"
                }}
              >
                {error}
              </p>
            )}
          </div>
        )}

        {/* 九宫格抽奖 */}
        {(verified || type !== "order_lottery") && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "24px 0",
              padding: "20px",
              background: styles.moduleDrawBackgroundColor || styles.drawBackgroundColor || "#1a0202",
              borderRadius: "8px"
            }}
          >
            <NineBoxLottery
              prizes={prizes}
              campaignStyles={styles}
              campaignContent={content}
              onComplete={handleComplete}
              disabled={!isActive}
            />
          </div>
        )}

        {/* 关闭按钮 */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(0, 0, 0, 0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "24px",
              lineHeight: "1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* 底部规则说明 */}
      {renderRules()}
    </div>
  )
}

