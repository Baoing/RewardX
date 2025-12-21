import type { ShopInfo } from "./shop.server"
import type { UserInfo } from "./user.server"

/**
 * 从用户数据生成 ShopInfo（客户端版本）
 * 当 Shopify API 不可用时，从数据库缓存恢复 Shop 数据
 */
export function userToShopInfo(user: UserInfo): ShopInfo | null {
  // 放宽条件：只要有 shop 域名就可以生成基本的 ShopInfo
  if (!user.myshopifyDomain && !user.shop) {
    console.warn("⚠️ 用户数据不完整，无法生成 ShopInfo")
    return null
  }

  const shopDomain = user.myshopifyDomain || user.shop

  console.log("💾 从数据库恢复 ShopInfo:", {
    shopId: user.shopId,
    shopName: user.shopName,
    order: user.order,
    domain: shopDomain
  })

  // 处理 installedAt 可能是字符串或 Date 对象的情况
  const createdAt = user.installedAt instanceof Date 
    ? user.installedAt.toISOString() 
    : (typeof user.installedAt === "string" 
      ? user.installedAt 
      : new Date().toISOString())

  return {
    id: user.shopId || `gid://shopify/Shop/0`, // 临时 ID
    name: user.shopName || user.shop,
    order: user.order || "",
    domain: user.domain || shopDomain,
    myshopifyDomain: shopDomain,
    primaryDomain: user.primaryDomain || shopDomain,
    primaryLocale: user.primaryLocale || user.language || "en",
    plan: {
      displayName: user.planDisplayName || "Unknown",
      partnerDevelopment: user.isPartnerDev,
      shopifyPlus: user.isShopifyPlus
    },
    currencyCode: user.currencyCode,
    timezone: user.timezone || "UTC",
    ianaTimezone: user.ianaTimezone || "UTC",
    createdAt
  }
}

