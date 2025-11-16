import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router"
import { authenticate } from "../shopify.server"
import { 
  checkAppEmbedEnabled, 
  enableAppEmbed 
} from "../utils/theme.server"

/**
 * GET - 检测 App Embed 状态
 * 使用 Theme Asset API 精确检测
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)

  try {
    console.log("🔍 开始检测 App Embed 状态...")
    
    // 从环境变量获取 API Key
    const appApiKey = process.env.SHOPIFY_API_KEY || ""
    
    if (!appApiKey) {
      console.error("❌ SHOPIFY_API_KEY 未配置")
      return Response.json({
        isEnabled: null,
        error: "App configuration error"
      })
    }

    // 使用 Theme API 检测（传递 session）
    const result = await checkAppEmbedEnabled(admin, appApiKey, session)
    
    console.log("✅ 检测完成:", result)
    
    return Response.json({
      ...result,
      shop: session.shop,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("❌ 检测 App Embed 失败:", error)
    return Response.json({
      isEnabled: null,
      error: error instanceof Error ? error.message : "Failed to check embed status"
    }, { status: 500 })
  }
}

/**
 * POST - 自动启用 App Embed
 * 使用 Theme Asset API 自动配置
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)

  try {
    console.log("🚀 开始自动启用 App Embed...")
    console.log("🔍 Admin 对象结构:", Object.keys(admin))
    console.log("🔍 Session 结构:", { shop: session.shop, hasToken: !!session.accessToken })

    // 从环境变量获取配置
    const appApiKey = process.env.SHOPIFY_API_KEY || ""
    const appHandle = process.env.SHOPIFY_APP_HANDLE || "smart-seo"
    
    if (!appApiKey) {
      return Response.json({
        success: false,
        error: "App configuration error"
      }, { status: 500 })
    }

    // 使用 Theme API 启用（传递 session）
    const result = await enableAppEmbed(admin, appApiKey, appHandle, session)
    
    if (result.success) {
      console.log("✅ App Embed 启用成功:", result.blockId)
    } else {
      console.error("❌ App Embed 启用失败:", result.error)
    }
    
    return Response.json({
      ...result,
      shop: session.shop,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("❌ 自动启用 App Embed 失败:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to enable embed"
    }, { status: 500 })
  }
}

