import { useRef, useState } from "react"
import { LuckyGrid } from "@lucky-canvas/react"
import type { Prize, CampaignStyles, CampaignContent } from "@plugin/main"
import {getComponentClassName} from "@/utils/className";
const cn = (name: string) => getComponentClassName("block", name)

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
  const prizeCount = Math.min(prizes.length, 8)
  const is6Prizes = prizeCount === 6
  const gridSize = is6Prizes ? 3 : 3 // 2x3 或 3x3
  const cols = is6Prizes ? 3 : 3
  const rows = is6Prizes ? 2 : 3

  // 转换奖品数据为 LuckyGrid 格式
  const blocks = [
    {
      padding: "10px",
      background: campaignStyles.moduleBorderColor || "#ff841f"
    }
  ]

  // 构建奖品数据
  const prizes_data = prizes.slice(0, prizeCount).map((prize, index) => {
    const x = is6Prizes ? (index % 3) : (index % 3)
    const y = is6Prizes ? Math.floor(index / 3) : Math.floor(index / 3)

    if(prize.image){
      return {
        x,
        y,
        background: campaignStyles.moduleBackgroundColor || "#ffcfa7",
        imgs: prize.image
          ? [
            {
              src: prize.image,
              width: "100%",
              top: "0%",
            }
          ]
          : []
      }
    }

    return {
      x,
      y,
      fonts: [
        {
          text: prize.name,
          top: prize.image ? "70%" : "50%",
          fontSize: "12px",
          fontColor: campaignStyles.moduleTextColor || "#000"
        }
      ],
      background: campaignStyles.moduleBackgroundColor || "#ffcfa7",
    }
  })

  const defaultStyle = {
    fontColor: campaignStyles.moduleTextColor || "#000",
    fontSize: "14px"
  }

  const defaultConfig = {
    speed: 20,
    accelerationTime: 2500,
    decelerationTime: 2500
  }

  // 验证订单号（内部处理）
  const handleVerify = async () => {
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
  }

  // 开始抽奖
  const handleStart = () => {
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
    setTimeout(() => {
      luckyGridRef.current?.stop(randomIndex)
    }, 2000 + Math.random() * 1000)
  }

  // 抽奖结束
  const handleEnd = (prizeIndex: any) => {
    setIsPlaying(false)
    const wonPrize = prizes[prizeIndex]

    if (onComplete && wonPrize) {
      onComplete(wonPrize)
    }
  }

  // 计算画布尺寸
  const canvasWidth = "500px"
  const canvasHeight = is6Prizes ? "500px" : "500px"

  // 渲染抽奖画布（仅在已验证或非订单抽奖时显示）
  const renderCanvas = () => {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <LuckyGrid
          ref={luckyGridRef}
          width={canvasWidth}
          height={canvasHeight}
          blocks={blocks}
          prizes={prizes_data}
          buttons={[]}
          defaultStyle={defaultStyle}
          defaultConfig={defaultConfig}
          onStart={handleStart}
          onEnd={handleEnd}
        />

        {disabled && (
          <div
            style={{
              position: "absolute",
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
              textAlign: "center",
              padding: "20px"
            }}
          >
            <p>抽奖活动暂未开始或已结束</p>
          </div>
        )}
      </div>
    )
  }

  // 渲染输入框和按钮
  const renderInput = () => {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
        maxWidth: canvasWidth,
        alignItems: "center"
      }}>
        {/* 输入框标题（仅 order 类型，未验证时显示） */}
        {campaignType === "order" && !verified && campaignContent.inputTitle && (
          <label className={cn("inputLabel")}>
            {campaignContent.inputTitle}
          </label>
        )}

        {/* 输入框和按钮行 */}
        <div style={{
          display: "flex",
          gap: "8px",
          alignItems: "flex-start",
          width: "100%"
        }}>

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
                    flex: 1,
                    padding: "10px 12px",
                    border: inputError ? "1px solid #e74c3c" : "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: campaignStyles.mainBackgroundColor || "#fff",
                    color: campaignStyles.mainTextColor || "#000",
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
                      padding: "10px 12px",
                      border: inputError ? "1px solid #e74c3c" : "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      backgroundColor: campaignStyles.mainBackgroundColor || "#fff",
                      color: campaignStyles.mainTextColor || "#000"
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
                        padding: "10px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                        backgroundColor: campaignStyles.mainBackgroundColor || "#fff",
                        color: campaignStyles.mainTextColor || "#000"
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
            disabled={disabled || isPlaying || inputLoading || (campaignType === "order" && !verified && !orderNumber.trim())}
            style={{
              backgroundColor: campaignStyles.moduleButtonColor || campaignStyles.buttonColor || "#8B4513",
              color: "#fff",
              border: "none",
              padding: "12px 48px",
              borderRadius: "4px",
              fontSize: "18px",
              fontWeight: 500,
              cursor: (disabled || isPlaying || inputLoading) ? "not-allowed" : "pointer",
              opacity: (disabled || isPlaying || inputLoading) ? 0.6 : 1,
              transition: "opacity 0.2s",
              whiteSpace: "nowrap"
            }}
          >
            {inputLoading
              ? "验证中..."
              : campaignType === "order" && !verified
              ? (campaignContent.buttonText || "Join")
              : isPlaying
              ? "抽奖中..."
              : (campaignContent.buttonText || "Start")
            }
          </button>
        </div>

        {/* 错误提示 */}
        {inputError && (
          <div style={{
            color: "#e74c3c",
            fontSize: "12px",
            width: "100%",
            textAlign: "left"
          }}>
            {inputError}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px"
    }}>
      {renderCanvas()}
      {renderInput()}
    </div>
  )
}
