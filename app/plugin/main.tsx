import React from "react"
import ReactDOM from "react-dom/client"
import { NineBoxLottery } from "./component/NineBoxLottery"
import { LotteryModal } from "./component/LotteryModal"
import { buildApiUrl, fetchApiJson } from "./utils/api"
// 导入全局样式（Storefront 使用）
import "./styles/global.scss"

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
  description?: string // 奖品描述
  type: "discount_percentage" | "discount_fixed" | "free_shipping" | "free_gift" | "no_prize"
  discountValue?: number
  giftProductId?: string
  giftVariantId?: string
  chancePercentage: number
  totalStock?: number | null
  usedStock?: number
  displayOrder?: number
  image?: string
  activeImage?: string
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
  titleColor?: string
  mainTextColor?: string
  mainBackgroundColor?: string
  moduleContainerBackgroundColor?: string
  moduleBorderColor?: string
  moduleDotsColor?: string
  moduleMainBackgroundColor?: string
  moduleCardBackgroundColor?: string
  moduleButtonColor?: string
  buttonColor?: string
  footerTextColor?: string
  customCSS?: string
}

export interface Campaign {
  id: string
  userId: string
  name: string
  type: "order" | "email_subscribe"
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
  requireOrder: boolean
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
 * 如果没有指定 campaign-id，则自动获取最新的活跃活动
 */
const initStorefront = () => {
  // 查找所有容器
  const containers = document.querySelectorAll("[data-rewardx-lottery]")

  if (containers.length === 0) {
    // 使用 MutationObserver 监听容器出现
    const observer = new MutationObserver(() => {
      const newContainers = document.querySelectorAll("[data-rewardx-lottery]")
      if (newContainers.length > 0) {
        observer.disconnect()
        initContainers(newContainers)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // 5秒后停止监听
    setTimeout(() => {
      observer.disconnect()
    }, 5000)

    return
  }

  initContainers(containers)
}

/**
 * 初始化容器
 */
const initContainers = (containers: NodeListOf<Element>) => {
  containers.forEach(async (container) => {
    const campaignId = container.getAttribute("data-campaign-id")
    let campaign: Campaign | null = null

    try {
      let endpoint: string

      if (campaignId) {
        // 如果指定了 campaign-id，获取指定活动
        endpoint = `/campaigns/${campaignId}`
      } else {
        // 如果没有指定 campaign-id，获取最新的活跃活动
        endpoint = `/campaigns/latest`
      }
      // 使用封装的 API 请求函数（自动添加 shop 参数）
      const data = await fetchApiJson<any>(endpoint, {}, container)

      if (campaignId) {
        campaign = data.campaign || data
      } else {
        if (data.success && data.campaign) {
          campaign = data.campaign
        } else {
          console.warn("RewardX: No active campaign found", data)
        }
      }

      if (!campaign) {
        console.warn("RewardX: Campaign not found")
        return
      }

      console.log(`✅ RewardX: Campaign loaded - ${campaign.name} (${campaign.id})`)

      // 获取 shop 信息（从容器元素的 data-shop 属性或从 API URL 中提取）
      const shop = container.getAttribute("data-shop") || 
                   container.closest("[data-shop]")?.getAttribute("data-shop") ||
                   (window.location.hostname.includes(".myshopify.com") ? window.location.hostname : null) ||
                   null

      // 检查渲染模式：从 data-render-mode 属性获取，默认为 "preview"
      // "preview" - 使用 PreviewGame（直接显示，不使用弹窗）
      // "modal" - 使用 LotteryModal（弹窗形式）
      const renderMode = container.getAttribute("data-render-mode") || "preview"
      
      // 渲染抽奖组件
      const root = ReactDOM.createRoot(container as HTMLElement)
      
      if (renderMode === "modal") {
        // 使用 Modal 形式
        root.render(
          <LotteryModal
            campaign={campaign}
            isAdmin={false} // Storefront 环境
            onPrizeWon={(prize) => {
              console.log("🎉 Prize won:", prize)
            }}
          />
        )
      } else {
        // 使用 PreviewGame 形式（默认）
        // 动态导入以避免循环依赖
        const PreviewGameModule = await import("./component/PreviewGame")
        const PreviewGameComponent = PreviewGameModule.PreviewGame || PreviewGameModule.default
        root.render(
          React.createElement(PreviewGameComponent, {
            campaign: campaign,
            isAdmin: false, // Storefront 环境
            shop: shop || undefined, // 保留以兼容旧代码
            container: container, // 传递容器元素，用于自动获取 shop 等公共参数
            onPrizeWon: (prize: Prize) => {
              console.log("🎉 Prize won:", prize)
            }
          })
        )
      }
    } catch (err) {
      console.error("❌ RewardX: Failed to load campaign", err)
    }
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

// PreviewGame 需要延迟导出，因为它可能依赖 main.tsx 中的类型
// 提供异步获取方法以避免循环依赖
export const getPreviewGame = async () => {
  const module = await import("./component/PreviewGame")
  return module.PreviewGame || module.default
}

// ============ 浏览器环境自动初始化 ============

if (typeof window !== "undefined") {
  // 等待 DOM 加载完成
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initStorefront()
    })
  } else {
    // DOM 已加载，但可能容器还没渲染，延迟一下
    setTimeout(() => {
      initStorefront()
    }, 100)
  }

  // 暴露全局 API
  ;(window as any).RewardX = {
    renderLotteryPreview,
    NineBoxLottery,
    LotteryModal,
    getPreviewGame, // 提供异步获取 PreviewGame 的方法
    init: initStorefront // 允许手动初始化
  }
  
  // 异步加载 PreviewGame 并添加到全局对象
  import("./component/PreviewGame").then((module) => {
    ;(window as any).RewardX.PreviewGame = module.PreviewGame || module.default
  }).catch((err) => {
    console.warn("⚠️ Failed to load PreviewGame:", err)
  })
}
