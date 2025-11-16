import prisma from "../db.server"
import type { ShopInfo } from "./shop.server"

export interface UserInfo {
  id: string
  shop: string
  
  // 店铺基本信息
  shopId: string | null
  email: string | null
  shopName: string | null
  domain: string | null
  myshopifyDomain: string | null
  primaryDomain: string | null
  primaryLocale: string | null
  
  // 店主信息
  ownerName: string | null
  firstName: string | null
  lastName: string | null
  
  // 地理位置信息
  country: string | null
  countryCode: string | null
  city: string | null
  province: string | null
  address: string | null
  zip: string | null
  phone: string | null
  
  // 货币和语言
  currency: string | null
  currencyCode: string
  language: string
  appLanguage: string | null
  timezone: string | null
  ianaTimezone: string | null
  
  // 店铺计划信息
  planName: string | null
  planDisplayName: string | null
  isShopifyPlus: boolean
  isPartnerDev: boolean
  
  // 应用配置
  theme: string
  notifications: boolean
  
  // 元数据
  installedAt: Date
  lastLoginAt: Date
  lastSyncAt: Date
  isActive: boolean
  isTrial: boolean
  trialEndsAt: Date | null
  
  settings: Record<string, any>
  metadata: Record<string, any>
}

/**
 * 创建或更新用户
 */
export async function upsertUser(shop: string, shopInfo?: ShopInfo | null, partnerLocale?: string) {
  const user = await prisma.user.upsert({
    where: { shop },
    update: {
      // 更新店铺基本信息（从 Shopify API 缓存）
      shopId: shopInfo?.id,
      email: shopInfo?.email,
      shopName: shopInfo?.name,
      domain: shopInfo?.domain,
      myshopifyDomain: shopInfo?.myshopifyDomain,
      primaryDomain: shopInfo?.primaryDomain,
      primaryLocale: shopInfo?.primaryLocale,
      
      // 更新货币和时区
      currency: shopInfo?.currencyCode,
      currencyCode: shopInfo?.currencyCode || undefined,
      timezone: shopInfo?.timezone,
      ianaTimezone: shopInfo?.ianaTimezone,
      
      // 更新计划信息
      planDisplayName: shopInfo?.plan?.displayName,
      isShopifyPlus: shopInfo?.plan?.shopifyPlus || false,
      isPartnerDev: shopInfo?.plan?.partnerDevelopment || false,
      
      // 更新 storefront 语言（如果 shopInfo 有值）
      language: shopInfo?.primaryLocale || undefined,
      
      // 更新元数据
      lastLoginAt: new Date(),
      lastSyncAt: shopInfo ? new Date() : undefined, // 如果有 shopInfo，更新同步时间
      isActive: true,
      
      // 注意：不更新 appLanguage，保持用户的选择
    },
    create: {
      shop,
      
      // 店铺基本信息
      shopId: shopInfo?.id,
      email: shopInfo?.email,
      shopName: shopInfo?.name,
      domain: shopInfo?.domain,
      myshopifyDomain: shopInfo?.myshopifyDomain,
      primaryDomain: shopInfo?.primaryDomain,
      primaryLocale: shopInfo?.primaryLocale,
      
      // 货币和时区
      currency: shopInfo?.currencyCode,
      currencyCode: shopInfo?.currencyCode || "USD",
      timezone: shopInfo?.timezone,
      ianaTimezone: shopInfo?.ianaTimezone,
      
      // 计划信息
      planDisplayName: shopInfo?.plan?.displayName,
      isShopifyPlus: shopInfo?.plan?.shopifyPlus || false,
      isPartnerDev: shopInfo?.plan?.partnerDevelopment || false,
      
      // 设置 language 为店铺的 storefront 默认语言
      language: shopInfo?.primaryLocale || "en",
      
      // appLanguage 不设置，保持为 null
      // 只有用户手动切换语言时才会保存
    }
  })

  return formatUser(user)
}

/**
 * 获取用户信息
 */
export async function getUser(shop: string): Promise<UserInfo | null> {
  const user = await prisma.user.findUnique({
    where: { shop }
  })

  if (!user) {
    return null
  }

  return formatUser(user)
}

/**
 * 更新用户配置
 */
export async function updateUserSettings(
  shop: string,
  updates: {
    appLanguage?: string
    language?: string
    timezone?: string
    theme?: string
    notifications?: boolean
    settings?: Record<string, any>
    metadata?: Record<string, any>
  }
) {
  const user = await prisma.user.update({
    where: { shop },
    data: {
      appLanguage: updates.appLanguage,
      language: updates.language,
      timezone: updates.timezone,
      theme: updates.theme,
      notifications: updates.notifications,
      settings: updates.settings ? JSON.stringify(updates.settings) : undefined,
      metadata: updates.metadata ? JSON.stringify(updates.metadata) : undefined,
      updatedAt: new Date()
    }
  })

  return formatUser(user)
}

/**
 * 更新用户店铺信息（从 Shopify API 获取后同步）
 */
export async function updateUserShopInfo(
  shop: string,
  info: {
    ownerName?: string
    firstName?: string
    lastName?: string
    country?: string
    countryCode?: string
    city?: string
    province?: string
    address?: string
    zip?: string
    phone?: string
  }
) {
  const user = await prisma.user.update({
    where: { shop },
    data: {
      ...info,
      updatedAt: new Date()
    }
  })

  return formatUser(user)
}

/**
 * 格式化用户数据
 */
function formatUser(user: any): UserInfo {
  return {
    id: user.id,
    shop: user.shop,
    
    // 店铺基本信息
    shopId: user.shopId,
    email: user.email,
    shopName: user.shopName,
    domain: user.domain,
    myshopifyDomain: user.myshopifyDomain,
    primaryDomain: user.primaryDomain,
    primaryLocale: user.primaryLocale,
    
    // 店主信息
    ownerName: user.ownerName,
    firstName: user.firstName,
    lastName: user.lastName,
    
    // 地理位置信息
    country: user.country,
    countryCode: user.countryCode,
    city: user.city,
    province: user.province,
    address: user.address,
    zip: user.zip,
    phone: user.phone,
    
    // 货币和语言
    currency: user.currency,
    currencyCode: user.currencyCode,
    language: user.language,
    appLanguage: user.appLanguage,
    timezone: user.timezone,
    ianaTimezone: user.ianaTimezone,
    
    // 店铺计划信息
    planName: user.planName,
    planDisplayName: user.planDisplayName,
    isShopifyPlus: user.isShopifyPlus,
    isPartnerDev: user.isPartnerDev,
    
    // 应用配置
    theme: user.theme,
    notifications: user.notifications,
    
    // 元数据
    installedAt: user.installedAt,
    lastLoginAt: user.lastLoginAt,
    lastSyncAt: user.lastSyncAt,
    isActive: user.isActive,
    isTrial: user.isTrial,
    trialEndsAt: user.trialEndsAt,
    
    settings: user.settings ? JSON.parse(user.settings) : {},
    metadata: user.metadata ? JSON.parse(user.metadata) : {}
  }
}

/**
 * 从用户数据生成 ShopInfo（降级方案）
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
    email: user.email,
    domain: shopDomain
  })

  return {
    id: user.shopId || `gid://shopify/Shop/0`, // 临时 ID
    name: user.shopName || user.shop,
    email: user.email || "",
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
    createdAt: user.installedAt.toISOString()
  }
}

