/**
 * Admin 工具函数
 * 用于在 storefront 调用时获取 admin 对象
 */

import { unauthenticated } from "@/shopify.server"
import prisma from "@/db.server"

/**
 * 通过 shop 信息从数据库获取 session 并创建 admin 对象
 * 用于在 storefront 调用时创建折扣码等需要 admin 权限的操作
 * 
 * @param shop - Shopify 店铺域名（如 "example.myshopify.com"）
 * @returns admin 对象，如果无法获取则返回 null
 */
export async function getAdminByShop(shop: string): Promise<any | null> {
  try {
    // 从数据库获取最新的 session
    const sessionRecord = await prisma.session.findFirst({
      where: {
        shop: shop
      },
      orderBy: {
        id: "desc"
      }
    })

    if (!sessionRecord) {
      console.warn(`⚠️ 未找到 shop ${shop} 的 session`)
      return null
    }

    // 检查 session 是否过期
    if (sessionRecord.expires && new Date(sessionRecord.expires) < new Date()) {
      console.warn(`⚠️ shop ${shop} 的 session 已过期`)
      return null
    }

    // 使用 unauthenticated.admin 创建 admin 对象
    // 注意：这需要 session 对象符合 Shopify 的 Session 接口
    const session = {
      id: sessionRecord.id,
      shop: sessionRecord.shop,
      state: sessionRecord.state || "",
      isOnline: sessionRecord.isOnline || false,
      scope: sessionRecord.scope || "",
      expires: sessionRecord.expires ? new Date(sessionRecord.expires) : undefined,
      accessToken: sessionRecord.accessToken || "",
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
    const { admin } = await unauthenticated.admin(session)

    return admin
  } catch (error) {
    console.error(`❌ 获取 shop ${shop} 的 admin 对象失败:`, error)
    return null
  }
}

