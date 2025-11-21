/**
 * 环境检测工具函数
 */

/**
 * 判断当前是否在 Shopify Admin 环境中
 * 
 * @returns true 如果在 Admin 环境，false 如果在 Storefront 或其他环境
 */
export function isAdmin(): boolean {
  // 服务端渲染时，默认返回 true（因为服务端路由都是 admin）
  if (typeof window === "undefined") {
    return true
  }

  // 检查 URL 是否包含 admin
  const hostname = window.location.hostname
  const pathname = window.location.pathname

  // Admin 环境的特征：
  // 1. hostname 包含 admin.shopify.com 或 myshopify.com/admin
  // 2. pathname 以 /app 开头（React Router 的 admin 路由）
  // 3. 在 iframe 中且 URL 包含 admin
  const isAdminHost = hostname.includes("admin.shopify.com") || 
                      hostname.includes("myshopify.com") ||
                      pathname.startsWith("/app")

  // 检查是否在 iframe 中（Admin 通常嵌入在 iframe）
  const isEmbedded = (() => {
    try {
      return window.top !== window.self
    } catch {
      // 跨域时会抛出异常，说明在 iframe 中
      return true
    }
  })()

  // 检查是否有 App Bridge（Admin 环境通常有）
  const hasAppBridge = typeof window !== "undefined" && 
                       (window as any).shopify?.appBridge !== undefined

  // 综合判断：Admin 环境通常是嵌入的，且 URL 包含 admin 特征，或有 App Bridge
  return isAdminHost || (isEmbedded && hasAppBridge) || pathname.startsWith("/app")
}

/**
 * 判断当前是否在 Shopify Storefront 环境中
 * 
 * @returns true 如果在 Storefront 环境
 */
export function isStorefront(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  // Storefront 环境的特征：
  // 1. 不在 iframe 中（或 iframe 但不在 admin）
  // 2. URL 不包含 admin 特征
  // 3. 可能是客户店铺的域名
  const hostname = window.location.hostname
  const pathname = window.location.pathname

  const isAdminHost = hostname.includes("admin.shopify.com") || 
                      pathname.startsWith("/app")

  return !isAdminHost && !isAdmin()
}

/**
 * 判断是否应该显示内容
 * 
 * @param isActive - 活动是否发布
 * @param forceShow - 是否强制显示（用于预览等场景）
 * @returns true 如果应该显示，false 如果不应该显示
 */
export function shouldShowContent(isActive: boolean, forceShow: boolean = false): boolean {
  // 强制显示（如预览模式）
  if (forceShow) {
    return true
  }

  // Admin 环境：始终显示（包括未发布的活动，用于预览）
  if (isAdmin()) {
    return true
  }

  // Storefront 环境：只显示已发布的活动
  return isActive
}

