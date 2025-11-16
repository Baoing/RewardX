import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "../shopify.server"
import { getCurrentSubscription, cancelSubscription } from "../services/subscription.server"
import prisma from "../db.server"

/**
 * POST - 取消当前订阅，切换到免费套餐
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)

  try {
    // 1. 获取用户信息
    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })

    if (!user) {
      return Response.json({
        success: false,
        error: "User not found"
      }, { status: 404 })
    }

    // 2. 获取当前活跃订阅
    const currentSubscription = await getCurrentSubscription(user.id)

    if (!currentSubscription) {
      return Response.json({
        success: false,
        error: "No active subscription found"
      }, { status: 404 })
    }

    // 3. 检查是否已经是免费套餐
    if (currentSubscription.planType === "free") {
      return Response.json({
        success: false,
        error: "Already on free plan"
      }, { status: 400 })
    }

    console.log("⚠️ 取消订阅请求:", {
      shop: session.shop,
      subscriptionId: currentSubscription.id,
      currentPlan: currentSubscription.planType
    })

    // 4. 取消订阅（立即取消）
    const cancelledSubscription = await cancelSubscription(
      currentSubscription.id,
      true,  // cancelImmediately = true
      "User switched to free plan"
    )

    console.log("✅ 订阅已取消:", {
      subscriptionId: cancelledSubscription.id,
      status: cancelledSubscription.status
    })

    // 5. 如果有 Shopify ChargeId，需要在 Shopify 端取消
    if (currentSubscription.shopifyChargeId && process.env.NODE_ENV === "production") {
      try {
        // 调用 Shopify API 取消订阅
        const cancelResponse = await admin.graphql(
          `#graphql
          mutation appSubscriptionCancel($id: ID!) {
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
              id: currentSubscription.shopifyChargeId
            }
          }
        )

        const cancelData = await cancelResponse.json()

        if (cancelData.data?.appSubscriptionCancel?.userErrors?.length > 0) {
          console.error("❌ Shopify 订阅取消失败:", cancelData.data.appSubscriptionCancel.userErrors)
        } else {
          console.log("✅ Shopify 订阅已取消")
        }
      } catch (error) {
        console.error("❌ 调用 Shopify 取消订阅 API 失败:", error)
        // 不阻断流程，本地数据库已标记为取消
      }
    }

    return Response.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        planType: cancelledSubscription.planType
      }
    })
  } catch (error) {
    console.error("❌ 取消订阅失败:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


