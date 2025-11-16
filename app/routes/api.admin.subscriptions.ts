/**
 * 管理员 API - 订阅管理
 * POST /api/admin/subscriptions/grant - 手动给用户开通套餐
 * POST /api/admin/subscriptions/cancel - 取消用户订阅
 * GET /api/admin/subscriptions/list - 获取订阅列表
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { prisma } from "../db.server"
import { createSubscription, cancelSubscription } from "../services/subscription.server"

// 简单的管理员验证（实际项目中应该使用更安全的方式）
const ADMIN_SECRET = process.env.ADMIN_SECRET || "your-admin-secret"

function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    throw new Response("Unauthorized", { status: 401 })
  }
}

/**
 * POST - 手动开通套餐
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  verifyAdmin(request)

  try {
    const formData = await request.formData()
    const action = formData.get("action") as string

    // 手动开通套餐
    if (action === "grant") {
      const shop = formData.get("shop") as string
      const planType = formData.get("planType") as string
      const billingCycle = formData.get("billingCycle") as string
      const grantedBy = formData.get("grantedBy") as string
      const grantReason = formData.get("grantReason") as string
      const durationDays = parseInt(formData.get("durationDays") as string || "30")

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { shop }
      })

      if (!user) {
        return Response.json({
          success: false,
          error: "User not found"
        }, { status: 404 })
      }

      // 创建订阅
      const subscription = await createSubscription({
        userId: user.id,
        planType: planType as any,
        billingCycle: billingCycle as any,
        isManualGrant: true,
        grantedBy,
        grantReason
      })

      // 直接激活
      const activeSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          grantExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
        }
      })

      console.log(`✅ 管理员 ${grantedBy} 为 ${shop} 手动开通了 ${planType} 套餐`)

      return Response.json({
        success: true,
        subscription: activeSubscription
      })
    }

    // 取消订阅
    if (action === "cancel") {
      const subscriptionId = formData.get("subscriptionId") as string
      const cancelReason = formData.get("reason") as string
      const immediate = formData.get("immediate") === "true"

      const subscription = await cancelSubscription(
        subscriptionId,
        immediate,
        cancelReason
      )

      return Response.json({
        success: true,
        subscription
      })
    }

    return Response.json({
      success: false,
      error: "Invalid action"
    }, { status: 400 })
  } catch (error) {
    console.error("❌ Admin API error:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * GET - 获取订阅列表
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  verifyAdmin(request)

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const planType = url.searchParams.get("planType")
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "50")

    const where: any = {}
    if (status) where.status = status
    if (planType) where.planType = planType

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              shop: true,
              email: true,
              shopName: true
            }
          },
          discount: true
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.subscription.count({ where })
    ])

    return Response.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("❌ Admin API error:", error)
    return Response.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


