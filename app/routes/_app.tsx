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

import { userToShopInfo } from "@/utils/shop.client"
import { StoreContext, userInfoStore, commonStore, campaignStore, campaignEditorStore, useCommonStore } from "@/stores"
import { LoadingScreen } from "@/components/LoadingScreen"
import "@/i18n/config"

// loader 已移除，完全由前端处理
// 返回必要的配置信息
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const partnerLocale = url.searchParams.get("locale") || "en"

  // eslint-disable-next-line no-undef
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    partnerLocale
  }
}

/**
 * 避免不必要的重新加载
 * 应用内路由切换时，不需要重新执行 loader
 *
 * ⚠️ 重要：这个函数会被所有子路由继承
 */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate
}: ShouldRevalidateFunctionArgs) {
  // 规范化路径
  const normalizePath = (path: string) => {
    if (!path || path === "/") return "/app"
    return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path
  }

  const currentPath = normalizePath(currentUrl.pathname)
  const nextPath = normalizePath(nextUrl.pathname)

  // 判断是否是应用内路由
  const isAppRoute = (path: string) => {
    if (path === "/app" || path === "/") return true
    if (path.startsWith("/app/")) return true
    return path === "/campaigns" ||
           path === "/billing" ||
           path === "/settings" ||
           path.startsWith("/campaigns/") ||
           path.startsWith("/billing/") ||
           path.startsWith("/settings/")
  }

  // 如果是在应用内路由之间切换，不重新加载
  if (isAppRoute(currentPath) && isAppRoute(nextPath)) {
    return false
  }

  // 其他情况（首次加载或外部跳转）使用默认行为
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
  const { apiKey, partnerLocale } = useLoaderData<typeof loader>()
  const commonStore = useCommonStore()

  // 🔥 使用 useRef 确保数据只加载一次，即使组件重新挂载也不会重复加载
  const hasLoadedRef = useRef(false)

  // 🔥 客户端加载数据：在 useEffect 中请求 API
  useEffect(() => {
    // 如果已经加载过，就不再加载
    if (hasLoadedRef.current) {
      console.log("⚡️ AppContent: 数据已加载，跳过重复请求")
      return
    }

    // 如果已经初始化过，标记为已加载并跳过
    if (commonStore.isLanguageInitialized && userInfoStore.isInitialized) {
      hasLoadedRef.current = true
      console.log("⚡️ AppContent: Store 已初始化，跳过加载")
      return
    }

    // 异步加载用户信息
    const loadUserData = async () => {
      try {
        // 创建带认证的 fetch 函数（每次请求时动态获取 token）
        let sessionToken: string | null = null

        // 尝试获取 session token
        if (typeof window !== "undefined") {
          try {
            const shopify = (window as any).shopify
            if (shopify?.appBridge) {
              if (typeof shopify.appBridge.getSessionToken === "function") {
                sessionToken = await shopify.appBridge.getSessionToken()
              } else if (typeof shopify.appBridge.idToken === "function") {
                sessionToken = await shopify.appBridge.idToken()
              }
            }
          } catch (error) {
            console.warn("⚠️ 无法获取 session token:", error)
          }
        }

        // 使用带认证的 fetch 获取用户信息
        const response = await fetch("/api/userInfo", {
          headers: {
            ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {})
          },
          credentials: "include"
        })
        const result = await response.json()

        if (result.userInfo) {
          const userInfo = result.userInfo
          // 从 userInfo 生成 shopInfo（降级方案，从数据库恢复）
          const shopInfo = userToShopInfo(userInfo)
          if (shopInfo) {
            commonStore.setShopInfo(shopInfo)
          }

          // 初始化语言
          if (!commonStore.isLanguageInitialized) {
            let targetLanguage: string = "en"
            if (userInfo.appLanguage) {
              targetLanguage = userInfo.appLanguage
            } else if (partnerLocale && partnerLocale !== "en") {
              targetLanguage = partnerLocale
            }
            console.log("初始化语言:", targetLanguage)
            commonStore.setLanguage(targetLanguage as any)
          }

          // 设置到 store
          userInfoStore.setUserInfo(userInfo)

          // 标记为已加载
          hasLoadedRef.current = true
        }
      } catch (error) {
        console.error("❌ 加载用户数据失败:", error)
        // 即使失败也标记为已加载，避免无限重试
        hasLoadedRef.current = true
      }
    }

    loadUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 空依赖数组，确保只执行一次

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

  // 🔥 使用 useRef 追踪初始化状态，一旦初始化完成就不再显示 LoadingScreen
  // 这样可以避免在应用内导航时重复显示 LoadingScreen
  const hasInitializedRef = useRef(false)
  const isFullyInitialized = commonStore.isFullyInitialized && userInfoStore.isInitialized

  // 一旦初始化完成，就标记为 true，后续不再显示 LoadingScreen
  if (isFullyInitialized && !hasInitializedRef.current) {
    hasInitializedRef.current = true
  }

  // 使用 ref 的值而不是计算值，避免路由切换时闪现 LoadingScreen
  const shouldShowLoading = !hasInitializedRef.current

  // 根据当前语言选择 Polaris 翻译（响应式）
  // 确保始终有一个有效的语言，避免样式问题
  const polarisI18n = useMemo(() => {
    const lang = commonStore.currentLanguage || "en"
    return polarisTranslations[lang] || enPolaris
  }, [commonStore.currentLanguage])

  // 🔥 检测是否在 Modal 中打开
  const isInModal = typeof window !== "undefined" && window.opener

  return (
    <AppProvider i18n={polarisI18n}>
      {shouldShowLoading ? (
        // 全局 Loading 状态（只在首次加载时显示）
        <LoadingScreen />
      ) : (
        // 应用主内容
        <>
          {/* 在 App Window 内不显示导航 */}
          {!isInModal && (
            <s-app-nav>
              <s-link href="/" rel="home">{t("nav.home")}</s-link>
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


