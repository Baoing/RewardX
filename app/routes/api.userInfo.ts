import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import { getUser } from "@/utils/user.server"

/**
 * GET - 获取用户信息
 * 认证：从请求头中获取 idToken (Authorization: Bearer <token>)
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // authenticate.admin 会自动从请求头中读取 Authorization token（idToken）
    const { session } = await authenticate.admin(request)

    const user = await getUser(session.shop)

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    return Response.json({ userInfo: user })
  } catch (error) {
    console.error("❌ API 认证失败:", error)
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
}

