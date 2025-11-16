import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "../shopify.server"
import { createSubscription as createShopifySubscription, BILLING_PLANS } from "../utils/billing.server"
import { createSubscription } from "../services/subscription.server"
import { PlanType, BillingCycle, isValidPlanType, isValidBillingCycle } from "../config/plans"
import prisma from "../db.server"

/**
 * POST - 创建订阅
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)

  try {
    const formData = await request.formData()
    const planKey = formData.get("plan") as string
    const billingCycle = formData.get("billingCycle") as string
    const discountCode = formData.get("discountCode") as string | null

    // 验证参数
    if (!isValidPlanType(planKey)) {
      return Response.json({
        success: false,
        error: "Invalid plan type"
      }, { status: 400 })
    }

    if (!isValidBillingCycle(billingCycle)) {
      return Response.json({
        success: false,
        error: "Invalid billing cycle"
      }, { status: 400 })
    }

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

    // 2. Free 套餐直接激活
    if (planKey === PlanType.FREE) {
      const subscription = await createSubscription({
        userId: user.id,
        planType: PlanType.FREE,
        billingCycle: billingCycle as BillingCycle
      })

      return Response.json({
        success: true,
        message: "Free plan activated",
        subscription
      })
    }

    // 3. 开发环境：直接激活订阅（跳过 Shopify Billing API）
    if (process.env.NODE_ENV !== "production") {
      const subscription = await createSubscription({
        userId: user.id,
        planType: planKey as PlanType,
        billingCycle: billingCycle as BillingCycle,
        discountCode: discountCode || undefined
      })

      // 直接激活订阅
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "active"
        }
      })

      console.log("✅ 开发模式：订阅已激活", {
        shop: session.shop,
        plan: planKey,
        cycle: billingCycle
      })

      return Response.json({
        success: true,
        message: "Development mode: Subscription activated without Shopify payment",
        subscription
      })
    }

    // 4. 生产环境：构建完整的 plan key（用于 Shopify Billing API）
    const fullPlanKey = billingCycle === BillingCycle.YEARLY ? `${planKey}-yearly` : planKey
    const planConfig = BILLING_PLANS[fullPlanKey as keyof typeof BILLING_PLANS]

    if (!planConfig) {
      return Response.json({
        success: false,
        error: "Invalid plan configuration"
      }, { status: 400 })
    }

    // 4. 先在数据库中创建订阅记录（状态为 pending）
    const dbSubscription = await createSubscription({
      userId: user.id,
      planType: planKey as PlanType,
      billingCycle: billingCycle as BillingCycle,
      discountCode: discountCode || undefined
    })

    // 5. 调用 Shopify Billing API 创建订阅
    const url = new URL(request.url)
    const returnUrl = `${url.origin}/app/billing/callback?subscriptionId=${dbSubscription.id}`

    const result = await createShopifySubscription(admin, session.shop, {
      ...planConfig,
      returnUrl,
      test: process.env.NODE_ENV !== "production"
    })

    if (!result.success) {
      // 创建失败，删除数据库记录
      await prisma.subscription.delete({
        where: { id: dbSubscription.id }
      })

      return Response.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    // 6. 更新订阅记录的 Shopify ChargeId
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        shopifyChargeId: result.subscription?.id,
        shopifyConfirmUrl: result.confirmationUrl
      }
    })

    // 7. 返回确认 URL
    return Response.json({
      success: true,
      confirmationUrl: result.confirmationUrl,
      subscriptionId: dbSubscription.id
    })
  } catch (error) {
    console.error("❌ 订阅请求处理失败:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

