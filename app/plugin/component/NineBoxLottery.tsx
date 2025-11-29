import { useRef, useState, useMemo, useCallback } from "react"
import { LuckyGrid } from "@lucky-canvas/react"
import type { Prize, CampaignStyles, CampaignContent } from "@plugin/main"
import { getComponentClassName } from "@/utils/className"
import { WinnerModal } from "./WinnerModal"

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
  phone = "",
  onOrderNumberChange,
  onOrderChange,
  onNameChange,
  onPhoneChange,
  onVerified,
}: NineBoxLotteryProps) => {
  const luckyGridRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [inputError, setInputError] = useState("") // 内部管理错误信息
  const [inputLoading, setInputLoading] = useState(false) // 内部管理加载状态
  const [wonPrize, setWonPrize] = useState<(Prize & { discountCode?: string | null; expiresAt?: string | null }) | null>(null) // 中奖奖品信息
  const [showWinnerModal, setShowWinnerModal] = useState(false) // 控制中奖弹窗显示

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
            width: "90%",
            top: "5%",
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
    speed: 10,
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

  // 开始抽奖（包含验证、抽奖、记录等完整流程）
  const handleStart = useCallback(async () => {
    if (disabled || isPlaying || inputLoading) {
      return
    }

    // 验证必填字段
    if (campaignType === "order" && !orderNumber.trim()) {
      setInputError(campaignContent.inputEmptyError || campaignContent.inputTitle || "Please enter your order number")
      return
    }

    if (!campaignId) {
      setInputError("Campaign ID is missing")
      return
    }

    setInputLoading(true)
    setInputError("")
    setIsPlaying(true)

    try {
      // 调用后端 API 进行完整抽奖流程（验证订单 -> 抽奖 -> 生成折扣码 -> 记录）
      const response = await fetch("/api/lottery/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          campaignId,
          type: campaignType === "order" ? "order" : "email_form",
          // 订单抽奖
          ...(campaignType === "order" && { orderNumber: orderNumber.trim() }),
          // 邮件表单抽奖
          ...(campaignType === "email_subscribe" && {
            email: order?.trim(),
            name: name?.trim(),
            phone: phone?.trim()
          })
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        // 处理错误响应
        if (data.hasPlayed && data.prizeId) {
          // 已经抽过奖，显示之前的结果并停止在之前的位置
          setInputError(
            data.previousEntry?.isWinner
              ? `You have already played. You won: ${data.previousEntry.prizeName}${data.previousEntry.discountCode ? ` (Code: ${data.previousEntry.discountCode})` : ""}`
              : "You have already played this lottery."
          )
          
          // 如果之前中奖了，保存中奖信息以便显示弹窗
          if (data.previousEntry?.isWinner) {
            const previousPrize = prizes.find(p => p.id === data.prizeId)
            if (previousPrize) {
              setWonPrize({
                ...previousPrize,
                discountCode: data.previousEntry.discountCode || null,
                expiresAt: null
              })
            }
          }
          
          // 根据奖品 ID 查找索引
          const prizeIndex = prizes.findIndex(p => p.id === data.prizeId)
          if (prizeIndex >= 0) {
            // 停止在之前中奖的位置（保持 isPlaying 状态，让动画完成）
            luckyGridRef.current?.play()
            setTimeout(() => {
              luckyGridRef.current?.stop(prizeIndex)
            }, ANIMATION_MIN_TIME)
          }
          // 注意：不在这里 return，让动画完成后通过 handleEnd 处理
          return
        }

        const errorMessage = data.error || data.reason || campaignContent.errorMessage || "Lottery failed. Please try again."
        setInputError(errorMessage)
        setIsPlaying(false)
        setInputLoading(false)
        return
      }

      // 抽奖成功，根据奖品 ID 查找索引
      const prizeId = data.prizeId
      if (!prizeId) {
        setInputError("Prize ID is missing")
        setIsPlaying(false)
        setInputLoading(false)
        return
      }

      // 在前端奖品数组中查找索引
      const prizeIndex = prizes.findIndex(p => p.id === prizeId)
      if (prizeIndex < 0) {
        console.error("❌ 奖品 ID 未找到:", prizeId, "可用奖品:", prizes.map(p => p.id))
        setInputError("Prize not found in frontend prizes array")
        setIsPlaying(false)
        setInputLoading(false)
        return
      }

      // API 调用成功后，开始抽奖动画
      // 注意：需要确保 luckyGridRef 已经准备好
      if (!luckyGridRef.current) {
        console.error("❌ LuckyGrid ref 未准备好")
        setInputError("Lottery component not ready")
        setIsPlaying(false)
        setInputLoading(false)
        return
      }

      // 保存中奖信息（如果中奖）
      if (data.entry?.isWinner && data.entry?.prize) {
        // 从本地奖品数组中查找完整的奖品信息（包含图片）
        const fullPrize = prizes.find(p => p.id === data.entry.prize.id)
        if (fullPrize) {
          const wonPrizeData = {
            ...fullPrize,
            discountCode: data.entry.prize.discountCode || null,
            expiresAt: data.entry.prize.expiresAt || null
          }
          setWonPrize(wonPrizeData)
          console.log("✅ 保存中奖信息:", {
            prizeId: wonPrizeData.id,
            prizeName: wonPrizeData.name,
            discountCode: wonPrizeData.discountCode,
            type: wonPrizeData.type
          })
        } else {
          // 如果找不到，使用 API 返回的数据
          const wonPrizeData = {
            id: data.entry.prize.id,
            name: data.entry.prize.name,
            type: data.entry.prize.type,
            discountValue: data.entry.prize.discountValue,
            chancePercentage: 0,
            discountCode: data.entry.prize.discountCode || null,
            expiresAt: data.entry.prize.expiresAt || null
          }
          setWonPrize(wonPrizeData)
          console.log("✅ 保存中奖信息（使用 API 数据）:", {
            prizeId: wonPrizeData.id,
            prizeName: wonPrizeData.name,
            discountCode: wonPrizeData.discountCode
          })
        }
      } else {
        console.log("ℹ️ 未中奖或没有奖品信息")
        setWonPrize(null)
      }

      // 开始抽奖动画
      luckyGridRef.current.play()

      // 2-3 秒后停止在中奖位置
      const animationTime = ANIMATION_MIN_TIME + Math.random() * (ANIMATION_MAX_TIME - ANIMATION_MIN_TIME)
      setTimeout(() => {
        if (luckyGridRef.current) {
          luckyGridRef.current.stop(prizeIndex)
          setIsPlaying(false)
        }
      }, animationTime)

      // 通知验证成功（如果有回调）
      onVerified?.(true)
    } catch (error) {
      console.error("❌ 抽奖失败:", error)
      setInputError(campaignContent.errorMessage || "Lottery failed. Please try again.")
      setIsPlaying(false)
    } finally {
      setInputLoading(false)
    }
  }, [disabled, isPlaying, inputLoading, campaignType, orderNumber, order, name, phone, campaignId, campaignContent, onVerified, prizes])

  // 抽奖结束回调
  const handleEnd = useCallback((prizeIndex: number) => {
    setIsPlaying(false)
    
    // 获取中奖的奖品
    const finalPrize = prizes[prizeIndex]
    if (finalPrize) {
      console.log("🎯 抽奖结束:", {
        prizeIndex,
        finalPrizeId: finalPrize.id,
        finalPrizeName: finalPrize.name,
        finalPrizeType: finalPrize.type,
        wonPrizeId: wonPrize?.id,
        wonPrizeType: wonPrize?.type
      })
      
      // 检查是否中奖（不是 "no_prize" 类型）
      if (finalPrize.type !== "no_prize") {
        // 如果之前保存了中奖信息（包含折扣码），使用保存的信息
        if (wonPrize && wonPrize.id === finalPrize.id) {
          // 使用保存的中奖信息（包含折扣码）
          console.log("✅ 显示中奖弹窗（使用保存的信息）:", {
            prizeName: wonPrize.name,
            discountCode: wonPrize.discountCode
          })
          setShowWinnerModal(true)
        } else {
          // 如果没有保存的信息，使用当前奖品信息（可能没有折扣码）
          // 这种情况不应该发生，因为 handleStart 中已经保存了中奖信息
          console.warn("⚠️ 未找到保存的中奖信息，使用当前奖品信息")
          setWonPrize({
            ...finalPrize,
            discountCode: null,
            expiresAt: null
          })
          setShowWinnerModal(true)
        }
      } else {
        console.log("ℹ️ 未中奖（no_prize 类型）")
      }
      
      // 调用外部回调
      onComplete?.(finalPrize)
    }
  }, [prizes, wonPrize, onComplete])

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
    return campaignContent.buttonText || "Start"
  }, [inputLoading, isPlaying, campaignContent.buttonText])

  // 按钮禁用状态
  const isButtonDisabled = useMemo(() =>
    disabled || isPlaying || inputLoading || (campaignType === "order" && !orderNumber.trim()),
    [disabled, isPlaying, inputLoading, campaignType, orderNumber]
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
        {/* 输入框标题 */}
        {campaignContent.inputTitle && (
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
                    if (e.key === "Enter" && !isButtonDisabled) {
                      handleStart()
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
          activeStyle={{
            fontColor: '#ffffff',
            background: '#ff841f'
          }}
          defaultStyle={defaultStyle}
          defaultConfig={defaultConfig}
          onEnd={handleEnd}
        />

        {disabled && (
          <div style={disabledOverlayStyle}>
            <p>The lucky draw event has not yet started or has ended.</p>
          </div>
        )}
      </div>

      <div className={cn("input-wrapper")}>
        {renderInput()}
      </div>

      {/* 中奖弹窗 */}
      {wonPrize && (
        <WinnerModal
          open={showWinnerModal}
          onClose={() => setShowWinnerModal(false)}
          prize={wonPrize}
        />
      )}
    </div>
  )
}
