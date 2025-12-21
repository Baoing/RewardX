import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import { getCurrentSubscription } from "@/services/subscription.server"
import { PlanType } from "@/config/plans"
import prisma from "@/db.server"

/**
 * GET - 获取账单页面数据
 * 认证：从请求头中获取 idToken (Authorization: Bearer <token>)
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // authenticate.admin 会自动从请求头中读取 Authorization token（idToken）
    const { session } = await authenticate.admin(request)

  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { shop: session.shop }
  })

  if (!user) {
    return Response.json({
      currentPlan: PlanType.FREE,
      hasCompletedSubscription: false,
      isInTrial: false
    })
  }

  // 获取当前订阅
  const subscription = await getCurrentSubscription(user.id)

  // 检查是否有已完成的付费订阅历史（排除当前试用中的订阅）
  const completedSubscriptionHistory = await prisma.subscription.findMany({
    where: {
      userId: user.id,
      planType: {
        not: PlanType.FREE
      },
      OR: [
        { isTrial: false },
        {
          AND: [
            { isTrial: true },
            { status: { in: ["cancelled", "expired"] } }
          ]
        }
      ]
    },
    select: {
      id: true,
      planType: true,
      status: true,
      isTrial: true
    }
  })

  // 判断当前是否在试用期内
  const isInTrial = subscription?.isTrial && subscription?.status === "active"

  return Response.json({
    currentPlan: subscription?.planType || PlanType.FREE,
    hasCompletedSubscription: completedSubscriptionHistory.length > 0,
    isInTrial: isInTrial || false
  })
  } catch (error) {
    console.error("❌ API 认证失败:", error)
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
}

