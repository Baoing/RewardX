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
  const [order, setOrder] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [verified, setVerified] = useState(false)
  const [recentWinner, setRecentWinner] = useState<string | null>(null)

  const { content = {}, styles = {}, prizes = [], type, isActive } = campaign

  // 判断是否应该显示内容
  // Admin 环境：始终显示（包括未发布的活动，用于预览）
  // Storefront 环境：只显示已发布的活动
  if (!isAdmin && !isActive) {
    return null
  }

  // 应用样式（TopBar 已移除，使用默认样式）
  const topBarStyle: React.CSSProperties = {
    backgroundColor: "#FF841F",
    color: "#000000",
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

  const footerStyle: React.CSSProperties = {
    backgroundColor: "#8B4513",
    color: styles.footerTextColor || "#fff",
    padding: "20px 24px",
    fontSize: "13px",
    lineHeight: "1.6"
  }

  // 验证状态变化回调
  const handleVerified = (isVerified: boolean) => {
    setVerified(isVerified)
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

        {/* 输入框标题（仅 order 类型，未验证时显示） */}
        {type === "order" && !verified && content.inputTitle && (
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

        {/* 九宫格抽奖画布（仅包含画布） */}
        {(verified || type !== "order") && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "24px 0",
              padding: "20px",
              background: styles.moduleMainBackgroundColor || "#1A0202",
              borderRadius: "8px"
            }}
          >
            <NineBoxLottery
              prizes={prizes}
              campaignStyles={styles}
              campaignContent={content}
              onComplete={handleComplete}
              disabled={!isActive}
              campaignId={campaign.id}
              campaignType={type}
              orderNumber={orderNumber}
              order={order}
              name={name}
              phone={phone}
              onOrderNumberChange={(value) => {
                setOrderNumber(value)
              }}
              onOrderChange={(value) => {
                setOrder(value)
              }}
              onNameChange={(value) => {
                setName(value)
              }}
              onPhoneChange={(value) => {
                setPhone(value)
              }}
              onVerified={handleVerified}
            />
          </div>
        )}

        {/* 输入框和按钮（在 lotterySection 外面） */}
        <NineBoxLottery
          prizes={prizes}
          campaignStyles={styles}
          campaignContent={content}
          onComplete={handleComplete}
          disabled={!isActive}
          campaignId={campaign.id}
          campaignType={type}
          orderNumber={orderNumber}
          order={order}
          name={name}
          phone={phone}
          onOrderNumberChange={(value) => {
            setOrderNumber(value)
          }}
          onOrderChange={(value) => {
            setOrder(value)
          }}
          onNameChange={(value) => {
            setName(value)
          }}
          onPhoneChange={(value) => {
            setPhone(value)
          }}
          onVerified={handleVerified}
        />

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

