/// <reference path="../globals.d.ts" />
import { useEffect, useMemo, useRef } from "react"
import type { HeadersFunction, LoaderFunctionArgs, ShouldRevalidateFunctionArgs } from "react-router"
import { Outlet, useLoaderData, useRouteError } from "react-router"
import { boundary } from "@shopify/shopify-app-react-router/server"
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react"
import { AppProvider, Frame } from "@shopify/polaris"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"

// Polaris 翻译
import enPolaris from "@shopify/polaris/locales/en.json"
import csPolaris from "@shopify/polaris/locales/cs.json"
import daPolaris from "@shopify/polaris/locales/da.json"
import dePolaris from "@shopify/polaris/locales/de.json"
import esPolaris from "@shopify/polaris/locales/es.json"
import fiPolaris from "@shopify/polaris/locales/fi.json"
import frPolaris from "@shopify/polaris/locales/fr.json"
import itPolaris from "@shopify/polaris/locales/it.json"
import jaPolaris from "@shopify/polaris/locales/ja.json"
import koPolaris from "@shopify/polaris/locales/ko.json"
import nbPolaris from "@shopify/polaris/locales/nb.json"
import nlPolaris from "@shopify/polaris/locales/nl.json"
import plPolaris from "@shopify/polaris/locales/pl.json"
import ptBRPolaris from "@shopify/polaris/locales/pt-BR.json"
import ptPTPolaris from "@shopify/polaris/locales/pt-PT.json"
import svPolaris from "@shopify/polaris/locales/sv.json"
import thPolaris from "@shopify/polaris/locales/th.json"
import trPolaris from "@shopify/polaris/locales/tr.json"
import zhCNPolaris from "@shopify/polaris/locales/zh-CN.json"
import zhTWPolaris from "@shopify/polaris/locales/zh-TW.json"

import { authenticate } from "@/shopify.server"
import { getShopInfo } from "@/utils/shop.server"
import { upsertUser } from "@/utils/user.server"
import { getCurrentSubscription } from "@/services/subscription.server"
import { StoreContext, userInfoStore, commonStore, campaignStore, campaignEditorStore, useCommonStore } from "@/stores"
import { LoadingScreen } from "@/components/LoadingScreen"
import "@/i18n/config"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)

  // 从 URL 参数中获取 locale（Partner 后台的语言）
  const url = new URL(request.url)
  const partnerLocale = url.searchParams.get("locale") || "en"

  // 获取店铺信息（包含 storefront 语言）
  let shopInfo = await getShopInfo(admin)

  // 创建或更新用户，传递 Partner locale
  const userInfo = await upsertUser(session.shop, shopInfo, partnerLocale)

  // 降级策略：如果 API 获取失败，从数据库恢复
  if (!shopInfo && userInfo) {
    const { userToShopInfo } = await import("@/utils/user.server")
    shopInfo = userToShopInfo(userInfo)
  }

  // 获取用户当前订阅
  let subscription = null
  if (userInfo) {
    subscription = await getCurrentSubscription(userInfo.id)
  }

  // 使用 console.table 优雅地打印用户信息
  console.log("\n === 用户信息 ===")
  console.table({
    "店铺": session.shop,
    "Partner locale": partnerLocale,
    "店铺语言": shopInfo?.primaryLocale || "未知",
    "用户语言": userInfo?.appLanguage || "未设置（使用 Partner 语言）",
    "当前套餐": subscription?.planType || "free",
    "套餐状态": subscription?.status || "无订阅",
    "计费周期": subscription?.billingCycle || "-",
    "配额限制": subscription?.quotaLimit ?? "20（默认）",
    "已用配额": subscription?.quotaUsed ?? 0,
    "试用期": subscription?.isTrial ? "是" : "否"
  })

  // eslint-disable-next-line no-undef
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopInfo,
    userInfo: {
      ...userInfo,
      subscription // 添加订阅信息
    },
    partnerLocale, // 传递 Partner 的 locale 参数
    session: {
      shop: session.shop,
      accessToken: session.accessToken ? "***" : null // 不暴露完整token
    }
  }
}

/**
 * 控制 loader 何时重新执行
 * 返回 false = 不重新加载（使用缓存数据）
 * 返回 true = 重新加载
 */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
  formAction
}: ShouldRevalidateFunctionArgs) {
  // 如果有表单提交，需要重新加载
  if (formAction) {
    console.log("🔄 表单提交，重新加载数据")
    return true
  }

  // 如果是从外部链接进入（带 shop 参数），需要加载
  if (nextUrl.searchParams.has("shop") && !currentUrl.searchParams.has("shop")) {
    console.log("🔄 首次进入应用，加载数据")
    return true
  }

  // 如果是在应用内导航（如首页 -> 设置），不重新加载
  if (currentUrl.pathname !== nextUrl.pathname &&
      currentUrl.pathname.startsWith("/app") &&
      nextUrl.pathname.startsWith("/app")) {
    console.log("⚡️ 应用内导航，使用缓存数据")
    return false
  }

  // 其他情况使用默认行为
  return defaultShouldRevalidate
}

const polarisTranslations: Record<string, any> = {
  en: enPolaris,
  "zh-CN": zhCNPolaris,
  "zh-TW": zhTWPolaris,
  cs: csPolaris,
  da: daPolaris,
  nl: nlPolaris,
  fi: fiPolaris,
  fr: frPolaris,
  de: dePolaris,
  it: itPolaris,
  ja: jaPolaris,
  ko: koPolaris,
  nb: nbPolaris,
  pl: plPolaris,
  "pt-BR": ptBRPolaris,
  "pt-PT": ptPTPolaris,
  es: esPolaris,
  sv: svPolaris,
  th: thPolaris,
  tr: trPolaris
}

// 分离出一个纯展示组件，不使用 observer
function AppContent() {
  const { apiKey, shopInfo, userInfo, partnerLocale } = useLoaderData<typeof loader>()
  const { t } = useTranslation()
  const commonStore = useCommonStore()
  // const renderCount = useRef(0)
  //
  // // 追踪渲染次数
  // useEffect(() => {
  //   renderCount.current += 1
  //   console.log(`🔄 AppContent 渲染次数: ${renderCount.current}`)
  // })

  // 🔥 关键优化：语言初始化提前到第一位（同步执行）
  // 使用 store 的初始化状态，避免重复初始化
  if (!commonStore.isLanguageInitialized && userInfo && partnerLocale) {
    let targetLanguage: string = "en"

    if (userInfo.appLanguage) {
      targetLanguage = userInfo.appLanguage
      // console.log("📝 使用用户设置的语言:", userInfo.appLanguage)
    } else if (partnerLocale && partnerLocale !== "en") {
      targetLanguage = partnerLocale
      // console.log("🌐 使用 Partner 后台语言:", partnerLocale)
    } else {
      // console.log("🔤 使用默认语言: en")
    }

    console.log("初始化语言:", targetLanguage)
    commonStore.setLanguage(targetLanguage as any)
  }

  // 初始化 stores（使用 store 的初始化标记）
  useEffect(() => {
    // 检查 UserInfo 是否已初始化
    if (!userInfoStore.isInitialized && userInfo) {
      userInfoStore.setUserInfo(userInfo)
    }

    // 检查 ShopInfo 是否已初始化
    if (!commonStore.isShopInfoInitialized && shopInfo) {
      commonStore.setShopInfo(shopInfo)
    }
  }, [userInfo, shopInfo, commonStore])

  return (
    <ShopifyAppProvider embedded apiKey={apiKey}>
      <PolarisProvider />
    </ShopifyAppProvider>
  )
}

// 分离出 Polaris Provider，使用 observer 监听语言变化
const PolarisProvider = observer(() => {
  const { t } = useTranslation()
  const commonStore = useCommonStore()

  // 根据当前语言选择 Polaris 翻译（响应式）
  const polarisI18n = useMemo(() => {
    return polarisTranslations[commonStore.currentLanguage] || enPolaris
  }, [commonStore.currentLanguage])

  // 🔥 检查是否全部初始化完成
  const isFullyInitialized = commonStore.isFullyInitialized && userInfoStore.isInitialized

  // 🔥 检测是否在 Modal 中打开
  // Shopify Modal 场景的判断条件：
  // 1. 在 iframe 中运行（window.self !== window.top）
  // 2. URL 中没有标准的 Shopify Admin 参数（如 shop, host）
  // 3. 或者 URL 包含特定的 modal 标记
  const isInModal = typeof window !== "undefined" && window.opener
  console.log(isInModal)
  return (
    <AppProvider i18n={polarisI18n}>
      {!isFullyInitialized ? (
        // 全局 Loading 状态（使用 Tailwind 组件）
        <LoadingScreen />
      ) : (
        // 应用主内容
        <>
          {/* 在 App Window 内不显示导航 */}
          {!isInModal && (
            <s-app-nav>
              <s-link href="/campaigns">{t("nav.campaigns")}</s-link>
              <s-link href="/billing">{t("nav.billing")}</s-link>
              <s-link href="/settings">{t("nav.settings")}</s-link>
            </s-app-nav>
          )}
          {/* 在 App Window 内不使用 Frame，直接渲染内容 */}
          {isInModal ? (
            <Outlet />
          ) : (
            <Frame>
              <Outlet />
            </Frame>
          )}
        </>
      )}
    </AppProvider>
  )
})

export default function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    // 确保 i18n 已初始化
    if (!i18n.isInitialized) {
      i18n.init()
    }
  }, [i18n])

  return (
    <StoreContext.Provider value={{ userInfoStore, commonStore, campaignStore, campaignEditorStore }}>
      <AppContent />
    </StoreContext.Provider>
  )
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError())
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs)
}


