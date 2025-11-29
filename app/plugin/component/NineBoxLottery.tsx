import { useRef, useState, useMemo, useCallback } from "react"
import { LuckyGrid } from "@lucky-canvas/react"
import type { Prize, CampaignStyles, CampaignContent } from "@plugin/main"
import { getComponentClassName } from "@/utils/className"

const cn = (name: string) => getComponentClassName("block", name)

// 常量定义
const CANVAS_WIDTH = "500px"
const CANVAS_HEIGHT_3_ROWS = "500px"
const MAX_PRIZES = 8
const GRID_COLS = 3
const GRID_ROWS_6_PRIZES = 2
const GRID_ROWS_9_PRIZES = 3
const ANIMATION_MIN_TIME = 2000
const ANIMATION_MAX_TIME = 3000

interface NineBoxLotteryProps {
  prizes: Prize[]
  campaignStyles?: CampaignStyles
  campaignContent?: CampaignContent
  onComplete?: (prize: Prize) => void
  disabled?: boolean
  // 输入框相关
  campaignId?: string // 活动 ID，用于验证订单号
  campaignType?: "order" | "email_subscribe"
  orderNumber?: string
  order?: string
  name?: string
  phone?: string
  onOrderNumberChange?: (value: string) => void
  onOrderChange?: (value: string) => void
  onNameChange?: (value: string) => void
  onPhoneChange?: (value: string) => void
  onVerified?: (verified: boolean) => void // 验证状态变化回调
}

/**
 * 九宫格抽奖组件
 * 支持 6 个奖品（2x3布局）或 8 个奖品（3x3布局，中间为按钮）
 * 基于 @lucky-canvas/react 的 LuckyGrid
 */
export const NineBoxLottery = ({
  prizes,
  campaignStyles = {},
  campaignContent = {},
  onComplete,
  disabled = false,
  campaignId,
  campaignType = "order",
  orderNumber = "",
  order = "",
  name = "",
  onOrderNumberChange,
  onOrderChange,
  onNameChange,
  onVerified,
}: NineBoxLotteryProps) => {
  const luckyGridRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [verified, setVerified] = useState(false) // 内部管理验证状态
  const [inputError, setInputError] = useState("") // 内部管理错误信息
  const [inputLoading, setInputLoading] = useState(false) // 内部管理加载状态

  // 确定布局：6个奖品用2x3，8个奖品用3x3
  const prizeCount = useMemo(() => Math.min(prizes.length, MAX_PRIZES), [prizes.length])
  const is6Prizes = useMemo(() => prizeCount === 6, [prizeCount])
  const cols = GRID_COLS
  const rows = useMemo(() => is6Prizes ? GRID_ROWS_6_PRIZES : GRID_ROWS_9_PRIZES, [is6Prizes])

  // 样式常量
  const borderColor = campaignStyles.moduleBorderColor || "#1a0202"
  const backgroundColor = campaignStyles.moduleBackgroundColor || "#ffcfa7"
  const textColor = campaignStyles.moduleTextColor || "#000"
  const buttonColor = campaignStyles.moduleButtonColor || campaignStyles.buttonColor || "#8B4513"
  const mainBackgroundColor = campaignStyles.mainBackgroundColor || "#fff"
  const mainTextColor = campaignStyles.mainTextColor || "#000"

  // 转换奖品数据为 LuckyGrid 格式
  // blocks 配置：按行定义，只需要 rows 个元素（参考代码示例）
  const blocks = useMemo(() => 
    Array.from({ length: rows }, () => ({
      padding: "4px",
      background: borderColor
    })), 
    [rows, borderColor]
  )

  // 构建奖品数据
  const prizes_data = useMemo(() => 
    prizes.slice(0, prizeCount).map((prize, index) => {
      const x = index % cols
      const y = Math.floor(index / cols)

      if (prize.image) {
        return {
          x,
          y,
          background: backgroundColor,
          imgs: [{
            src: prize.image,
            width: "100%",
            top: "0%",
          }]
        }
      }

      return {
        x,
        y,
        fonts: [{
          text: prize.name,
          top: "50%",
          fontSize: "12px",
          fontColor: textColor
        }],
        background: backgroundColor,
      }
    }), 
    [prizes, prizeCount, cols, backgroundColor, textColor]
  )

  const defaultStyle = useMemo(() => ({
    fontColor: textColor,
    fontSize: "14px"
  }), [textColor])

  const defaultConfig = useMemo(() => ({
    speed: 20,
    accelerationTime: 2500,
    decelerationTime: 2500
  }), [])

  // 输入框基础样式
  const inputBaseStyle = useMemo(() => ({
    padding: "10px 12px",
    borderRadius: "4px",
    fontSize: "14px",
    backgroundColor: mainBackgroundColor,
    color: mainTextColor,
  }), [mainBackgroundColor, mainTextColor])

  // 验证订单号（内部处理）
  const handleVerify = useCallback(async () => {
    if (!orderNumber.trim()) {
      setInputError(campaignContent.inputEmptyError || campaignContent.inputTitle || "Please enter your order number")
      return
    }

    if (!campaignId) {
      setInputError("Campaign ID is missing")
      return
    }

    setInputLoading(true)
    setInputError("")

    try {
      // 调用后端 API 验证订单号
      const response = await fetch("/api/lottery/verify-order-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          campaignId
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        // 处理错误响应
        const errorMessage = data.error || data.reason || campaignContent.errorMessage || "Order verification failed. Please check if the order number is correct."
        setInputError(errorMessage)
        setInputLoading(false)
        return
      }

      // 检查是否可以抽奖
      if (!data.canPlay) {
        if (data.hasPlayed) {
          // 已经抽过奖，显示之前的结果
          setInputError(
            data.previousEntry?.isWinner
              ? `You have already played. You won: ${data.previousEntry.prizeName}${data.previousEntry.discountCode ? ` (Code: ${data.previousEntry.discountCode})` : ""}`
              : "You have already played this lottery."
          )
        } else {
          // 其他原因不能抽奖
          setInputError(data.reason || "This order cannot be used for lottery")
        }
        setInputLoading(false)
        return
      }

      // 验证成功
      setVerified(true)
      setInputError("")
      onVerified?.(true)
    } catch (error) {
      console.error("❌ 验证订单号失败:", error)
      setInputError(campaignContent.errorMessage || "Order verification failed. Please try again.")
    } finally {
      setInputLoading(false)
    }
  }, [orderNumber, campaignId, campaignContent, onVerified])

  // 开始抽奖
  const handleStart = useCallback(() => {
    if (disabled || isPlaying) {
      return
    }

    // 如果是订单抽奖且未验证，先验证
    if (campaignType === "order" && !verified) {
      handleVerify()
      return
    }

    setIsPlaying(true)

    // 模拟随机抽奖（实际应该调用后端 API）
    // TODO: 调用 /api/lottery/play 获取真实中奖结果
    const randomIndex = Math.floor(Math.random() * prizeCount)
    const wonPrize = prizes[randomIndex]

    // 开始抽奖动画
    luckyGridRef.current?.play()

    // 2-3 秒后停止在中奖位置
    const animationTime = ANIMATION_MIN_TIME + Math.random() * (ANIMATION_MAX_TIME - ANIMATION_MIN_TIME)
    setTimeout(() => {
      luckyGridRef.current?.stop(randomIndex)
    }, animationTime)
  }, [disabled, isPlaying, campaignType, verified, handleVerify, prizeCount, prizes])

  // 抽奖结束
  const handleEnd = useCallback((prizeIndex: number) => {
    setIsPlaying(false)
    const wonPrize = prizes[prizeIndex]
    onComplete?.(wonPrize)
  }, [prizes, onComplete])

  // 计算画布尺寸
  const canvasWidth = CANVAS_WIDTH
  const canvasHeight = useMemo(() => {
    if (is6Prizes) {
      const baseHeight = Math.round(500 * (rows / 3))
      return `${baseHeight + 4}px` // 添加间距
    }
    return CANVAS_HEIGHT_3_ROWS
  }, [is6Prizes, rows])

  // 按钮文案
  const buttonText = useMemo(() => {
    if (inputLoading || isPlaying) return "Loading..."
    if (campaignType === "order" && !verified) {
      return campaignContent.buttonText || "Join"
    }
    return campaignContent.buttonText || "Start"
  }, [inputLoading, isPlaying, campaignType, verified, campaignContent.buttonText])

  // 按钮禁用状态
  const isButtonDisabled = useMemo(() => 
    disabled || isPlaying || inputLoading || (campaignType === "order" && !verified && !orderNumber.trim()),
    [disabled, isPlaying, inputLoading, campaignType, verified, orderNumber]
  )

  // 禁用遮罩样式
  const disabledOverlayStyle = useMemo(() => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    textAlign: "center" as const,
    padding: "20px"
  }), [])

  // 输入框容器样式
  const inputContainerStyle = useMemo(() => ({
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    width: "100%",
    alignItems: "center" as const
  }), [])

  // 输入框行样式
  const inputRowStyle = useMemo(() => ({
    display: "flex",
    gap: "8px",
    alignItems: "flex-start" as const,
    width: "100%"
  }), [])

  // 错误提示样式
  const errorTextStyle = useMemo(() => ({
    color: "#e74c3c",
    fontSize: "12px",
    width: "100%",
    textAlign: "left" as const
  }), [])

  // 渲染输入框和按钮
  const renderInput = () => {
    return (
      <div style={inputContainerStyle}>
        {/* 输入框标题（仅 order 类型，未验证时显示） */}
        {campaignType === "order" && !verified && campaignContent.inputTitle && (
          <label className={cn("inputLabel")}>
            {campaignContent.inputTitle}
          </label>
        )}

        {/* 输入框和按钮行 */}
        <div style={inputRowStyle}>

          {/* 输入框（订单号或邮件订阅） */}
          {campaignType === "order" || campaignType === "email_subscribe" ? (
            <>
              {/* 订单号输入框 */}
              {campaignType === "order" && (
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => onOrderNumberChange?.(e.target.value)}
                  placeholder={campaignContent.inputPlaceholder || "Enter your order number"}
                  disabled={inputLoading || disabled || isPlaying}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && campaignType === "order") {
                      handleVerify()
                    }
                  }}
                  style={{
                    ...inputBaseStyle,
                    flex: 1,
                    border: inputError ? "1px solid #e74c3c" : "1px solid #ddd",
                    minWidth: "200px",
                    height: "51px"
                  }}
                />
              )}

              {/* 邮件订阅输入框 */}
              {campaignType === "email_subscribe" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <input
                    type="email"
                    value={order}
                    onChange={(e) => onOrderChange?.(e.target.value)}
                    placeholder={campaignContent.inputPlaceholder || "Enter your email"}
                    disabled={inputLoading || disabled || isPlaying}
                    style={{
                      ...inputBaseStyle,
                      border: inputError ? "1px solid #e74c3c" : "1px solid #ddd"
                    }}
                  />
                  {name !== undefined && (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => onNameChange?.(e.target.value)}
                      placeholder="Enter your name (optional)"
                      disabled={inputLoading || disabled || isPlaying}
                      style={{
                        ...inputBaseStyle,
                        border: "1px solid #ddd"
                      }}
                    />
                  )}
                </div>
              )}
            </>
          ) : null}

          {/* 抽奖按钮 */}
          <button
            onClick={handleStart}
            disabled={isButtonDisabled}
            style={{
              backgroundColor: buttonColor,
              color: "#fff",
              border: "none",
              padding: "12px 48px",
              borderRadius: "4px",
              fontSize: "18px",
              fontWeight: 500,
              cursor: isButtonDisabled ? "not-allowed" : "pointer",
              opacity: isButtonDisabled ? 0.6 : 1,
              transition: "opacity 0.2s",
              whiteSpace: "nowrap"
            }}
          >
            {buttonText}
          </button>
        </div>

        {/* 错误提示 */}
        {inputError && (
          <div style={errorTextStyle}>
            {inputError}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("contain")}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <LuckyGrid
          ref={luckyGridRef}
          width={canvasWidth}
          height={canvasHeight}
          rows={rows}
          cols={cols}
          blocks={blocks}
          prizes={prizes_data}
          buttons={[]}
          defaultStyle={defaultStyle}
          defaultConfig={defaultConfig}
          onStart={handleStart}
          onEnd={handleEnd}
        />

        {disabled && (
          <div style={disabledOverlayStyle}>
            <p>抽奖活动暂未开始或已结束</p>
          </div>
        )}
      </div>

      <div className={cn("input-wrapper")}>
        {renderInput()}
      </div>
    </div>
  )
}
