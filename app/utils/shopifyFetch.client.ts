/**
 * Shopify App Bridge Authenticated Fetch
 * 为嵌入式 Shopify App 提供认证的 fetch 包装
 */

import { useAppBridge } from "@shopify/shopify-app-react-router/react"

/**
 * 获取经过 Shopify App Bridge 认证的 fetch 函数
 * 在 Shopify Admin 嵌入环境中使用
 */
export const useAuthenticatedFetch = () => {
  const appBridge = useAppBridge()
  
  return async (url: string, init?: RequestInit) => {
    // 使用 App Bridge 的 authenticated fetch
    // 这会自动添加 Shopify session token
    return fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        "Authorization": `Bearer ${await appBridge.idToken()}`
      }
    })
  }
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

