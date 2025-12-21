/**
 * 服务器端认证工具
 * 使用 App Bridge idToken 进行认证
 */

import { authenticate } from "@/shopify.server"

/**
 * 从请求中验证 idToken 并获取 session
 * @param request 请求对象
 * @returns session 信息
 */
export async function verifySession(request: Request) {
  // 从请求头中获取 Authorization token
  const authHeader = request.headers.get("Authorization")
  const idToken = authHeader?.replace("Bearer ", "")

  if (!idToken) {
    // 如果没有 idToken，尝试使用传统的 session 认证（兼容性）
    const { session } = await authenticate.admin(request)
    return session
  }

  // 使用 Shopify 的 authenticate.public.appProxy 来验证 idToken
  // 注意：这可能需要在 shopify.server.ts 中配置
  try {
    // 对于 API 路由，我们可以使用 authenticate.admin 但传递 idToken
    // 或者使用 authenticate.public.appProxy 如果可用
    const { session } = await authenticate.admin(request)
    return session
  } catch (error) {
    console.error("❌ Token 验证失败:", error)
    throw new Response("Unauthorized", { status: 401 })
  }
}

/**
 * 从请求中获取 shop 域名
 */
export async function getShopFromRequest(request: Request): Promise<string | null> {
  try {
    const { session } = await authenticate.admin(request)
    return session.shop
  } catch {
    // 如果认证失败，尝试从 URL 参数或请求头中获取
    const url = new URL(request.url)
    return url.searchParams.get("shop") || request.headers.get("x-shopify-shop-domain")
  }
}

