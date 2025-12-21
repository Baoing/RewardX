/**
 * Shopify App Bridge Authenticated Fetch
 * 为嵌入式 Shopify App 提供认证的 fetch 包装
 * 注意：此文件只能在客户端使用
 */

import { useCallback } from "react"

/**
 * 获取 session token（使用 Shopify App Bridge）
 * 根据 Shopify 文档：https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens
 */
async function getSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null

  try {
    // 方法1: 从 ShopifyAppProvider context 获取
    // 在 React Router v7 + Shopify App Router 中，App Bridge 会暴露在 window 上
    const shopify = (window as any).shopify
    
    if (shopify?.appBridge) {
      // 使用 App Bridge 的 getSessionToken 方法
      if (typeof shopify.appBridge.getSessionToken === "function") {
        return await shopify.appBridge.getSessionToken()
      }
      // 或者使用 idToken 方法（如果是新版本）
      if (typeof shopify.appBridge.idToken === "function") {
        return await shopify.appBridge.idToken()
      }
    }

    // 方法2: 尝试从全局 App Bridge 实例获取
    const appBridge = (window as any).__SHOPIFY_APP_BRIDGE__
    if (appBridge) {
      if (typeof appBridge.getSessionToken === "function") {
        return await appBridge.getSessionToken()
      }
      if (typeof appBridge.idToken === "function") {
        return await appBridge.idToken()
      }
    }

    // 方法3: 使用 @shopify/app-bridge/utilities 的 getSessionToken（如果可用）
    try {
      const { getSessionToken } = await import("@shopify/app-bridge/utilities")
      if (appBridge && typeof getSessionToken === "function") {
        return await getSessionToken(appBridge)
      }
    } catch {
      // 导入失败，继续尝试其他方法
    }

    return null
  } catch (error) {
    console.warn("⚠️ 无法获取 session token:", error)
    return null
  }
}

/**
 * 获取经过 Shopify App Bridge 认证的 fetch 函数
 * 在 Shopify Admin 嵌入环境中使用
 * 
 * 注意：此函数需要在 ShopifyAppProvider 内部使用
 */
export const useAuthenticatedFetch = () => {
  // 返回一个稳定的 fetch 函数
  return useCallback(async (url: string, init?: RequestInit) => {
    try {
      const sessionToken = await getSessionToken()

      // 构建请求头
      const headers: HeadersInit = {
        ...init?.headers,
        ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {})
      }

      return fetch(url, {
        ...init,
        headers,
        credentials: "include"
      })
    } catch (error) {
      console.error("❌ Authenticated fetch 失败:", error)
      // 降级：直接使用 fetch（不带认证）
      return fetch(url, {
        ...init,
        credentials: "include"
      })
    }
  }, [])
}

/**
 * 检查当前是否在 Shopify 嵌入环境中
 */
export const isEmbedded = (): boolean => {
  if (typeof window === "undefined") return false
  
  try {
    return window.top !== window.self
  } catch {
    // 如果抛出异常，说明在 iframe 中
    return true
  }
}

