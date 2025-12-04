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
 * 获取应用 API URL
 * 优先使用 Vite 注入的环境变量
 *
 * 环境变量配置：
 * - REWARDX_APP_URL: 应用部署 URL（例如: https://your-app.vercel.app）
 * - 如果没有设置，会使用 SHOPIFY_APP_URL
 */
const getAppApiUrl = (): string => {
  // 1. 优先使用 Vite 注入的环境变量（构建时替换）
  // Vite 的 define 会在构建时替换 process.env.REWARDX_APP_URL
  // @ts-ignore - Vite 会在构建时替换这个值
  let envUrl = process.env.REWARDX_APP_URL || process.env.SHOPIFY_APP_URL

  if (envUrl) {
    // 移除末尾的斜杠，避免双斜杠
    return envUrl.replace(/\/+$/, "")
  }

  // 2. 尝试从 window 对象获取（如果 Liquid 传递了）
  const windowUrl = (window as any).__REWARDX_APP_URL__
  if (windowUrl) {
    // 移除末尾的斜杠
    return String(windowUrl).replace(/\/+$/, "")
  }

  // 3. 尝试从配置脚本中读取（Metafield 配置）
  const configScript = document.querySelector('script[id^="rewardx-api-config-"]')
  if (configScript && configScript.textContent) {
    try {
      const config = JSON.parse(configScript.textContent)
      if (config.apiUrl) {
        // 移除末尾的斜杠
        return String(config.apiUrl).replace(/\/+$/, "")
      }
    } catch (e) {
      console.warn("⚠️ RewardX: Failed to parse API config", e)
    }
  }

  // 4. 最后回退：使用当前域名（不推荐，但作为兜底）
  return window.location.origin.replace(/\/+$/, "")
}

/**
 * 构建 API URL
 */
const buildApiUrl = (endpoint: string): string => {
  const apiBase = getAppApiUrl()
  // 移除 endpoint 开头的斜杠，避免双斜杠
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint

  return `${apiBase}/api/${cleanEndpoint}`
}

/**
 * 初始化容器
 */
const initContainers = (containers: NodeListOf<Element>) => {
  containers.forEach(async (container) => {
    const campaignId = container.getAttribute("data-campaign-id")
    let campaign: Campaign | null = null

    try {
      let apiUrl: string

      if (campaignId) {
        // 如果指定了 campaign-id，获取指定活动
        apiUrl = buildApiUrl(`/campaigns/${campaignId}`)
      } else {
        // 如果没有指定 campaign-id，获取最新的活跃活动
        // 从当前页面 URL 提取 shop 域名
        const currentHostname = window.location.hostname
        let shopParam = ""
        if (currentHostname.includes(".myshopify.com")) {
          shopParam = `?shop=${currentHostname}`
        } else {
          // 尝试从其他方式获取 shop
          const shopFromData = container.getAttribute("data-shop")
          if (shopFromData) {
            shopParam = `?shop=${shopFromData}`
          }
        }
        apiUrl = buildApiUrl(`/campaigns/latest${shopParam}`)
      }
      let response: Response
      try {
        response = await fetch(apiUrl, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        })
      } catch (fetchError: any) {
        // 处理网络错误（DNS 解析失败、连接超时等）
        const errorMessage = fetchError?.message || String(fetchError)
        // 其他网络错误
        throw fetchError
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

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

      // 渲染抽奖组件
      const root = ReactDOM.createRoot(container as HTMLElement)
      root.render(
        <LotteryModal
          campaign={campaign}
          isAdmin={false} // Storefront 环境
          onPrizeWon={(prize) => {
            console.log("🎉 Prize won:", prize)
          }}
        />
      )
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
    init: initStorefront // 允许手动初始化
  }
}
