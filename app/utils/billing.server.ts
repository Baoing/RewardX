/**
 * Shopify Billing API 集成
 * 用于创建订阅和管理计费
 */

import type { Session } from "@shopify/shopify-api"

export interface BillingPlan {
  name: string
  price: number
  interval: "EVERY_30_DAYS" | "ANNUAL"
  trialDays?: number
  test?: boolean
}

/**
 * 创建订阅（使用 App Billing API）
 */
export async function createSubscription(
  admin: any,
  shop: string,
  plan: BillingPlan
) {
  try {
    const response = await admin.graphql(
      `#graphql
      mutation CreateSubscription($name: String!, $price: Decimal!, $interval: AppPricingInterval!, $trialDays: Int, $test: Boolean) {
        appSubscriptionCreate(
          name: $name
          returnUrl: "${process.env.SHOPIFY_APP_URL}/billing/callback"
          test: $test
          lineItems: [{
            plan: {
              appRecurringPricingDetails: {
                price: { amount: $price, currencyCode: USD }
                interval: $interval
              }
            }
          }]
          trialDays: $trialDays
        ) {
          appSubscription {
            id
            name
            status
            createdAt
            trialDays
            currentPeriodEnd
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          name: plan.name,
          price: plan.price.toString(),
          interval: plan.interval,
          trialDays: plan.trialDays,
          test: plan.test ?? true // 开发环境默认使用测试模式
        }
      }
    )

    const data = await response.json()

    if (data.errors) {
      console.error("❌ GraphQL 错误:", data.errors)
      return {
        success: false,
        error: data.errors[0]?.message || "Failed to create subscription"
      }
    }

    const result = data.data?.appSubscriptionCreate

    if (result?.userErrors?.length > 0) {
      console.error("❌ 用户错误:", result.userErrors)
      return {
        success: false,
        error: result.userErrors[0]?.message || "Failed to create subscription"
      }
    }

    console.log("✅ 订阅创建成功:", result.appSubscription)

    return {
      success: true,
      subscription: result.appSubscription,
      confirmationUrl: result.confirmationUrl
    }
  } catch (error) {
    console.error("❌ 创建订阅失败:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * 获取当前订阅状态
 */
export async function getCurrentSubscription(admin: any) {
  try {
    const response = await admin.graphql(
      `#graphql
      query GetSubscription {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            createdAt
            currentPeriodEnd
            trialDays
            test
            lineItems {
              id
              plan {
                pricingDetails {
                  __typename
                  ... on AppRecurringPricing {
                    price {
                      amount
                      currencyCode
                    }
                    interval
                  }
                }
              }
            }
          }
        }
      }`
    )

    const data = await response.json()

    if (data.errors) {
      console.error("❌ GraphQL 错误:", data.errors)
      return null
    }

    const subscriptions = data.data?.currentAppInstallation?.activeSubscriptions

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ 没有活跃订阅")
      return null
    }

    // 返回第一个活跃订阅
    return subscriptions[0]
  } catch (error) {
    console.error("❌ 获取订阅失败:", error)
    return null
  }
}

/**
 * 取消订阅
 */
export async function cancelSubscription(admin: any, subscriptionId: string) {
  try {
    const response = await admin.graphql(
      `#graphql
      mutation CancelSubscription($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          id: subscriptionId
        }
      }
    )

    const data = await response.json()

    if (data.errors) {
      console.error("❌ GraphQL 错误:", data.errors)
      return {
        success: false,
        error: data.errors[0]?.message || "Failed to cancel subscription"
      }
    }

    const result = data.data?.appSubscriptionCancel

    if (result?.userErrors?.length > 0) {
      console.error("❌ 用户错误:", result.userErrors)
      return {
        success: false,
        error: result.userErrors[0]?.message || "Failed to cancel subscription"
      }
    }

    console.log("✅ 订阅取消成功")

    return {
      success: true,
      subscription: result.appSubscription
    }
  } catch (error) {
    console.error("❌ 取消订阅失败:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * 套餐配置映射
 */
export const BILLING_PLANS = {
  free: {
    name: "Free Plan",
    price: 0,
    interval: "EVERY_30_DAYS" as const,
    trialDays: 0
  },
  starter: {
    name: "Starter Plan",
    price: 9.9,
    interval: "EVERY_30_DAYS" as const,
    trialDays: 7
  },
  "starter-yearly": {
    name: "Starter Plan (Yearly)",
    price: 99,
    interval: "ANNUAL" as const,
    trialDays: 7
  },
  professional: {
    name: "Professional Plan",
    price: 29.9,
    interval: "EVERY_30_DAYS" as const,
    trialDays: 7
  },
  "professional-yearly": {
    name: "Professional Plan (Yearly)",
    price: 299,
    interval: "ANNUAL" as const,
    trialDays: 7
  },
  enterprise: {
    name: "Enterprise Plan",
    price: 99.9,
    interval: "EVERY_30_DAYS" as const,
    trialDays: 14
  },
  "enterprise-yearly": {
    name: "Enterprise Plan (Yearly)",
    price: 999,
    interval: "ANNUAL" as const,
    trialDays: 14
  }
}

