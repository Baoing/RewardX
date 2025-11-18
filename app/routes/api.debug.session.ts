/**
 * Session 调试工具
 * GET /api/debug/session
 * 
 * 用于排查认证问题
 */

import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import prisma from "@/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    console.log("🔍 开始 Session 调试...")
    
    // 尝试认证
    const { session } = await authenticate.admin(request)
    
    console.log("✅ 认证成功！")
    console.log("Session Info:", {
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope
    })
    
    // 检查数据库中的 session
    const dbSessions = await prisma.session.findMany({
      where: {
        shop: session.shop
      },
      orderBy: {
        id: "desc"
      },
      take: 5
    })
    
    console.log(`📊 数据库中找到 ${dbSessions.length} 个 sessions`)
    
    return Response.json({
      success: true,
      authenticated: true,
      session: {
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope
      },
      dbSessions: dbSessions.map(s => ({
        id: s.id,
        shop: s.shop,
        state: s.state,
        isOnline: s.isOnline,
        expires: s.expires
      })),
      requestInfo: {
        url: request.url,
        method: request.method,
        headers: {
          "user-agent": request.headers.get("user-agent"),
          "referer": request.headers.get("referer"),
          "cookie": request.headers.get("cookie") ? "存在" : "不存在"
        }
      }
    })
    
  } catch (error) {
    console.error("❌ 认证失败:", error)
    
    // 检查是否有任何 session 在数据库中
    const allSessions = await prisma.session.findMany({
      orderBy: {
        id: "desc"
      },
      take: 5
    })
    
    return Response.json({
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
      requestInfo: {
        url: request.url,
        method: request.method,
        headers: {
          "user-agent": request.headers.get("user-agent"),
          "referer": request.headers.get("referer"),
          "cookie": request.headers.get("cookie") ? "存在" : "不存在"
        }
      },
      dbSessions: allSessions.map(s => ({
        id: s.id,
        shop: s.shop,
        state: s.state,
        isOnline: s.isOnline,
        expires: s.expires
      }))
    }, { status: 401 })
  }
}

