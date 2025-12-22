/**
 * API: 获取订单列表
 */

import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // 验证管理员权限
    const { session } = await authenticate.admin(request)

    if (!session) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // 解析查询参数
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100)
    const skip = (page - 1) * limit

    // 查询订单
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      prisma.order.count({
        where: {
          userId: user.id
        }
      })
    ])

    return Response.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error("❌ 获取订单列表错误:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 })
  }
}

