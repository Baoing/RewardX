/**
 * Admin 工具函数
 * 用于在 storefront 调用时获取 admin 对象
 */

import { unauthenticated, sessionStorage } from "@/shopify.server"
import prisma from "@/db.server"

/**
 * 通过 shop 信息从数据库获取 session 并创建 admin 对象
 * 用于在 storefront 调用时创建折扣码等需要 admin 权限的操作
 * 
 * @param shop - Shopify 店铺域名（如 "example.myshopify.com"）
 * @returns admin 对象，如果无法获取则返回 null
 */
/**
 * 规范化 shop 域名格式
 * 确保 shop 格式为 "example.myshopify.com"
 */
function normalizeShop(shop: string | null | undefined): string | null {
  if (!shop) return null
  
  // 如果已经是完整格式，直接返回
  if (shop.includes(".myshopify.com")) {
    return shop
  }
  
  // 如果只是店铺名，添加 .myshopify.com 后缀
  if (shop && !shop.includes(".")) {
    return `${shop}.myshopify.com`
  }
  
  // 其他情况返回 null
  return null
}

export async function getAdminByShop(shop: string | null | undefined): Promise<any | null> {
  try {
    // 规范化 shop 格式
    const normalizedShop = normalizeShop(shop)
    
    if (!normalizedShop) {
      console.warn(`⚠️ 无效的 shop 格式: ${shop}`)
      return null
    }

    console.log(`🔍 查找 shop ${normalizedShop} 的 session`)

    // 从数据库获取最新的 session
    const sessionRecord = await prisma.session.findFirst({
      where: {
        shop: normalizedShop
      },
      orderBy: {
        id: "desc"
      }
    })

    if (!sessionRecord) {
      console.warn(`⚠️ 未找到 shop ${normalizedShop} 的 session`)
      return null
    }

    // 检查 session 是否过期
    if (sessionRecord.expires && new Date(sessionRecord.expires) < new Date()) {
      console.warn(`⚠️ shop ${normalizedShop} 的 session 已过期`)
      return null
    }

    // 检查 accessToken 是否存在
    if (!sessionRecord.accessToken) {
      console.warn(`⚠️ shop ${normalizedShop} 的 session 没有 accessToken`)
      return null
    }

    // 检查 scope 是否包含 write_discounts
    const scope = sessionRecord.scope || ""
    if (!scope.includes("write_discounts")) {
      console.warn(`⚠️ shop ${normalizedShop} 的 session scope 不包含 write_discounts，当前 scope: ${scope}`)
      // 不返回 null，继续尝试创建，因为可能 scope 已更新但数据库未同步
    }

    console.log(`✅ 找到 shop ${normalizedShop} 的 session，创建 admin 对象`)
    console.log(`   - session id: ${sessionRecord.id}`)
    console.log(`   - scope: ${scope}`)
    console.log(`   - expires: ${sessionRecord.expires ? new Date(sessionRecord.expires).toISOString() : "never"}`)

    // 构建 session 对象（符合 Shopify Session 接口）
    const session = {
      id: sessionRecord.id,
      shop: sessionRecord.shop,
      state: sessionRecord.state || "",
      isOnline: sessionRecord.isOnline || false,
      scope: sessionRecord.scope || "",
      expires: sessionRecord.expires ? new Date(sessionRecord.expires) : undefined,
      accessToken: sessionRecord.accessToken,
      // 可选字段
      userId: sessionRecord.userId ? sessionRecord.userId.toString() : undefined,
      firstName: sessionRecord.firstName || undefined,
      lastName: sessionRecord.lastName || undefined,
      email: sessionRecord.email || undefined,
      accountOwner: sessionRecord.accountOwner || false,
      locale: sessionRecord.locale || undefined,
      collaborator: sessionRecord.collaborator || false
    }

    // 使用 unauthenticated.admin 创建 admin GraphQL 客户端
    // unauthenticated.admin 接受 shop 域名，然后从 sessionStorage 加载 session
    // 但我们需要确保 session 已经在 sessionStorage 中
    // 由于我们是从数据库读取的 session，需要确保它也在 sessionStorage 中
    
    // 方法：使用 sessionStorage 保存 session（如果不存在），然后使用 unauthenticated.admin
    // 但更简单的方法是直接使用 GraphQL 客户端，使用 accessToken
    
    // 尝试使用 unauthenticated.admin，它应该能够从 sessionStorage 加载 session
    // 如果 session 不在 sessionStorage 中，我们需要先保存它
    try {
      // 检查 session 是否在 sessionStorage 中
      const existingSession = await sessionStorage.loadSession(session.id)
      
      if (!existingSession) {
        // 如果不存在，保存 session 到 sessionStorage
        await sessionStorage.storeSession(session as any)
        console.log(`✅ 已将 session 保存到 sessionStorage: ${session.id}`)
      }
      
      // 使用 unauthenticated.admin 创建 admin GraphQL 客户端
      // unauthenticated.admin 接受 shop 域名，然后从 sessionStorage 加载
      const { admin } = await unauthenticated.admin(normalizedShop)
      
      console.log(`✅ 成功创建 shop ${normalizedShop} 的 admin 对象`)
      return admin
    } catch (error) {
      console.error(`❌ 使用 unauthenticated.admin 失败:`, error)
      // 如果 unauthenticated.admin 失败，返回 null
      return null
    }
  } catch (error) {
    console.error(`❌ 获取 shop ${shop} 的 admin 对象失败:`, error)
    return null
  }
}

