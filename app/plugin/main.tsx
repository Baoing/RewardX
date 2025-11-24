import ReactDOM from "react-dom/client"
import { NineBoxLottery } from "./component/NineBoxLottery"
import { LotteryModal } from "./component/LotteryModal"

/**
 * RewardX Plugin - Main Entry
 * 
 * 这个文件会被打包成 IIFE 格式，可以直接在 Shopify Storefront 中使用
 * 
 * 使用方式：
 * 1. Storefront: 在 Liquid 中通过 data 属性传递数据
 * 2. Admin 预览: 直接导入组件使用
 */

// ============ 类型定义（与后端保持一致） ============

export interface Prize {
  id?: string
  name: string // 奖品名称（与数据库字段一致）
  type: "discount_percentage" | "discount_fixed" | "free_shipping" | "free_gift" | "no_prize"
  discountValue?: number
  giftProductId?: string
  giftVariantId?: string
  chancePercentage: number
  totalStock?: number | null
  usedStock?: number
  displayOrder?: number
  image?: string
  isActive?: boolean
}

export interface CampaignContent {
  title?: string
  description?: string
  inputTitle?: string
  inputPlaceholder?: string
  inputEmptyError?: string
  errorMessage?: string
  buttonText?: string
  rulesText1?: string
  rulesText2?: string
}

export interface CampaignStyles {
  mainTextColor?: string
  mainBackgroundColor?: string
  topBarTextColor?: string
  topBarBackgroundColor?: string
  moduleTextColor?: string
  moduleBackgroundColor?: string
  moduleBorderColor?: string
  moduleDrawBackgroundColor?: string
  drawBackgroundColor?: string
  moduleButtonColor?: string
  buttonColor?: string
  footerTextColor?: string
  customCSS?: string
}

export interface Campaign {
  id: string
  userId: string
  name: string
  type: "order_lottery" | "email_subscribe"
  gameType: "ninebox" | "wheel" | "slot" | "scratch"
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  startAt?: string
  endAt?: string
  scheduleType?: "all_time" | "time_period"
  isActive: boolean
  content?: CampaignContent
  styles?: CampaignStyles
  allowedOrderStatus: string
  requireEmail: boolean
  requireName: boolean
  requirePhone: boolean
  gameConfig: string
  totalPlays: number
  totalWins: number
  totalOrders: number
  createdAt: string
  updatedAt: string
  prizes?: Prize[]
}

// ============ Storefront 初始化函数 ============

/**
 * Storefront 初始化函数
 * 在页面加载时自动查找并初始化所有抽奖容器
 */
const initStorefront = () => {
  const containers = document.querySelectorAll("[data-rewardx-lottery]")
  
  containers.forEach((container) => {
    const campaignId = container.getAttribute("data-campaign-id")
    
    if (!campaignId) {
      console.warn("RewardX: data-campaign-id is required")
      return
    }

    // 加载活动数据并渲染
    fetch(`/api/campaigns/${campaignId}`)
      .then(res => res.json())
      .then(campaign => {
        const root = ReactDOM.createRoot(container as HTMLElement)
        root.render(
          <LotteryModal
            campaign={campaign}
            isAdmin={false} // Storefront 环境
            onPrizeWon={(prize) => {
              console.log("Prize won:", prize)
            }}
          />
        )
      })
      .catch(err => {
        console.error("RewardX: Failed to load campaign", err)
      })
  })
}

// ============ Admin 预览渲染函数 ============

/**
 * Admin 预览渲染函数
 * 直接传入 campaign 数据进行渲染
 */
export const renderLotteryPreview = (
  container: HTMLElement,
  campaign: Campaign,
  isAdmin: boolean = true // Admin 预览模式默认为 true
) => {
  const root = ReactDOM.createRoot(container)
  root.render(
    <LotteryModal
      campaign={campaign}
      isAdmin={isAdmin}
      onPrizeWon={(prize) => {
        console.log("🎉 Prize won:", prize)
      }}
    />
  )
  
  return () => {
    root.unmount()
  }
}

// ============ 导出组件供 Admin 端直接导入使用 ============

export { NineBoxLottery, LotteryModal }

// ============ 浏览器环境自动初始化 ============

if (typeof window !== "undefined") {
  // 等待 DOM 加载完成
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStorefront)
  } else {
    initStorefront()
  }

  // 暴露全局 API
  ;(window as any).RewardX = {
    renderLotteryPreview,
    NineBoxLottery,
    LotteryModal
  }
}
