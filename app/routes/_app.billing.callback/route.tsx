import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { authenticate } from "../../shopify.server"
import { getCurrentSubscription as getShopifySubscription } from "../../utils/billing.server"
import { activateSubscription } from "../../services/subscription.server"
import { prisma } from "../../db.server"

/**
 * GET - 订阅确认回调
 * 用户在 Shopify 后台确认订阅后会重定向到这里
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)

  try {
    const url = new URL(request.url)
    const charge_id = url.searchParams.get("charge_id")
    const subscriptionId = url.searchParams.get("subscriptionId")

    console.log("✅ 订阅回调:", { charge_id, subscriptionId, shop: session.shop })

    // 1. 从 Shopify 获取最新的订阅状态
    const shopifySubscription = await getShopifySubscription(admin)

    if (!shopifySubscription) {
      console.warn("⚠️ 未找到 Shopify 订阅")
      return redirect("/app/billing?error=subscription_not_found")
    }

    // 2. 更新数据库中的订阅状态
    if (subscriptionId) {
      // 如果有 subscriptionId，激活对应的订阅
      await activateSubscription(subscriptionId, shopifySubscription)
      console.log("✅ 订阅已激活:", subscriptionId)
    } else {
      // 兼容旧流程：通过 shopifyChargeId 查找并激活
      const dbSubscription = await prisma.subscription.findUnique({
        where: { shopifyChargeId: charge_id || undefined }
      })

      if (dbSubscription) {
        await activateSubscription(dbSubscription.id, shopifySubscription)
        console.log("✅ 订阅已激活（通过 ChargeId）:", dbSubscription.id)
      } else {
        console.warn("⚠️ 未找到数据库订阅记录")
      }
    }

    // 3. 重定向回 Billing 页面
    return redirect("/app/billing?success=true")
  } catch (error) {
    console.error("❌ 订阅回调处理失败:", error)
    return redirect("/app/billing?error=callback_failed")
  }
}

