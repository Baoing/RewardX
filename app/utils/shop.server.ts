export interface ShopInfo {
  id: string
  name: string
  order: string
  domain: string
  myshopifyDomain: string
  primaryDomain: string
  primaryLocale: string // 店铺的主要语言（从 enabledPresentmentCurrencies 推断或默认）
  plan: {
    displayName: string
    partnerDevelopment: boolean
    shopifyPlus: boolean
  }
  currencyCode: string
  timezone: string
  ianaTimezone: string
  createdAt: string
}

/**
 * 获取店铺信息
 */
export async function getShopInfo(admin: any): Promise<ShopInfo | null> {
  try {
    const response = await admin.graphql(
      `#graphql
      query getShopInfo {
        shop {
          id
          name
          myshopifyDomain
          primaryDomain {
            url
          }
          plan {
            displayName
            partnerDevelopment
            shopifyPlus
          }
          currencyCode
          timezoneAbbreviation
          ianaTimezone
          createdAt
          billingAddress {
            country
            countryCode
          }
        }
      }`
    )

    const data = await response.json()

    if (data.errors) {
      console.error("❌ GraphQL 错误:", data.errors)
      return null
    }

    if (data.data?.shop) {
      const shop = data.data.shop

      // 根据国家代码推断语言
      const countryCode = shop.billingAddress?.countryCode
      let inferredLocale = "en" // 默认英语

      // 根据国家代码推断语言
      if (countryCode === "CN") inferredLocale = "zh-CN"
      else if (countryCode === "TW" || countryCode === "HK") inferredLocale = "zh-TW"
      else if (countryCode === "JP") inferredLocale = "ja"
      else if (countryCode === "KR") inferredLocale = "ko"
      else if (countryCode === "FR") inferredLocale = "fr"
      else if (countryCode === "DE") inferredLocale = "de"
      else if (countryCode === "ES") inferredLocale = "es"
      else if (countryCode === "IT") inferredLocale = "it"
      else if (countryCode === "BR") inferredLocale = "pt-BR"
      else if (countryCode === "PT") inferredLocale = "pt-PT"

      return {
        id: shop.id,
        name: shop.name,
        order: "", // Shopify Shop API 不提供 order 字段，从数据库获取
        domain: shop.myshopifyDomain,
        myshopifyDomain: shop.myshopifyDomain,
        primaryDomain: shop.primaryDomain?.url || shop.myshopifyDomain,
        primaryLocale: inferredLocale, // 从国家代码推断
        plan: {
          displayName: shop.plan.displayName,
          partnerDevelopment: shop.plan.partnerDevelopment,
          shopifyPlus: shop.plan.shopifyPlus
        },
        currencyCode: shop.currencyCode,
        timezone: shop.timezoneAbbreviation,
        ianaTimezone: shop.ianaTimezone,
        createdAt: shop.createdAt
      }
    }

    return null
  } catch (error) {
    console.error("❌ 获取店铺信息失败:", error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * 获取店铺的基本统计信息
 */
export async function getShopStats(admin: any) {
  try {
    const response = await admin.graphql(
      `#graphql
      query getShopStats {
        productsCount: productsCount {
          count
        }
        customersCount: customersCount {
          count
        }
        ordersCount: ordersCount {
          count
        }
      }`
    )

    const data = await response.json()

    return {
      products: data.data?.productsCount?.count || 0,
      customers: data.data?.customersCount?.count || 0,
      orders: data.data?.ordersCount?.count || 0
    }
  } catch (error) {
    console.error("Failed to fetch shop stats:", error)
    return {
      products: 0,
      customers: 0,
      orders: 0
    }
  }
}

