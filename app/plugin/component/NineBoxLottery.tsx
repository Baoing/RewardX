import { useRef, useState } from "react"
import { LuckyGrid } from "@lucky-canvas/react"
import type { Prize, CampaignStyles, CampaignContent } from "@plugin/main"

interface NineBoxLotteryProps {
  prizes: Prize[]
  campaignStyles?: CampaignStyles
  campaignContent?: CampaignContent
  onComplete?: (prize: Prize) => void
  disabled?: boolean
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
  disabled = false
}: NineBoxLotteryProps) => {
  const luckyGridRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)

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
      imgs: prize.image
        ? [
            {
              src: prize.image,
              width: "60%",
              top: "15%"
            }
          ]
        : []
    }
  })

  // 按钮位置：6个奖品时在底部中间，8个奖品时在中间
  const buttonX = is6Prizes ? 1 : 1
  const buttonY = is6Prizes ? 2 : 1

  // 如果是6个奖品，需要添加按钮
  if (is6Prizes) {
    prizes_data.push({
      x: buttonX,
      y: buttonY,
      fonts: [],
      background: "transparent",
      imgs: []
    })
  }

  const buttons = [
    {
      x: buttonX,
      y: buttonY,
      background: campaignStyles.moduleButtonColor || campaignStyles.buttonColor || "#8B4513",
      fonts: [
        {
          text: campaignContent.buttonText || "Start",
          fontSize: "18px",
          fontColor: "#fff"
        }
      ]
    }
  ]

  const defaultStyle = {
    fontColor: campaignStyles.moduleTextColor || "#000",
    fontSize: "14px"
  }

  const defaultConfig = {
    speed: 20,
    accelerationTime: 2500,
    decelerationTime: 2500
  }

  // 开始抽奖
  const handleStart = () => {
    if (disabled || isPlaying) {
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
  const canvasWidth = is6Prizes ? "450px" : "500px"
  const canvasHeight = is6Prizes ? "300px" : "500px"

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <LuckyGrid
        ref={luckyGridRef}
        width={canvasWidth}
        height={canvasHeight}
        blocks={blocks}
        prizes={prizes_data}
        buttons={buttons}
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
