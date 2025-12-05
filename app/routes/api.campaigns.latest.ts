/**
 * GET /api/campaigns/latest
 * 获取商店最新的活跃活动（用于 Storefront）
 *
 * 此接口已在 CORS 白名单中，允许所有来源访问
 * 白名单配置：app/config/cors.ts
 *
 * 注意：此接口需要从请求中获取 shop 信息
 * 可以通过以下方式：
 * 1. 从 Referer 头中提取 shop 域名
 * 2. 从查询参数中获取 shop
 * 3. 从 Shopify session（如果存在）
 */
import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import { handleCorsPreflight, jsonWithCors, getUserByShop } from "@/utils/api.server"
import { getCampaignsByUserId } from "@/services/campaign.server"

/**
 * 从请求中提取 shop 域名
 */
const getShopFromRequest = (request: Request): string | null => {
  const url = new URL(request.url)

  // 1. 从查询参数获取
  const shopParam = url.searchParams.get("shop")
  if (shopParam) {
    return shopParam.includes(".") ? shopParam : `${shopParam}.myshopify.com`
  }

  // 2. 从 Referer 头获取
  const referer = request.headers.get("Referer")
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const hostname = refererUrl.hostname
      // 提取 myshopify.com 域名
      if (hostname.includes(".myshopify.com")) {
        return hostname
      }
      // 如果是自定义域名，尝试从 Referer 中提取
      const shopMatch = referer.match(/https?:\/\/([^.]+\.myshopify\.com)/)
      if (shopMatch) {
        return shopMatch[1]
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse Referer:", e)
    }
  }

  // 3. 尝试从 Shopify session 获取（如果存在）
  try {
    const session = request.headers.get("Cookie")
    if (session) {
      // 这里可以尝试解析 session cookie，但通常需要 authenticate.admin
      // 暂时返回 null，让下面的代码处理
    }
  } catch (e) {
    // 忽略错误
  }

  return null
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // 处理 OPTIONS 预检请求（强制允许所有来源）
  const preflightResponse = handleCorsPreflight(request, true)
  if (preflightResponse) {
    return preflightResponse
  }

  try {
    let shop: string | null = null
    let user: any = null

    // 尝试从请求中获取 shop
    shop = getShopFromRequest(request)

    // 如果无法从请求中获取，尝试使用 authenticate.admin（可能失败）
    if (!shop) {
      try {
        const { session } = await authenticate.admin(request)
        shop = session.shop
      } catch (authError) {
        console.warn("⚠️ Authentication failed, trying alternative methods:", authError)
      }
    }

    if (!shop) {
      return jsonWithCors(
        { success: false, error: "Shop domain is required. Please provide 'shop' query parameter or ensure you have a valid Shopify session." },
        { status: 400 },
        request,
        true
      )
    }

    user = await getUserByShop(shop)

    // 获取所有活跃的活动，按更新时间倒序排列
    const campaigns = await getCampaignsByUserId(user.id, {})

    // 筛选出活跃的活动并按更新时间排序
    const activeCampaigns = campaigns
      .filter(c => c.isActive === true)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    // 返回最新的一个活动
    const latestCampaign = activeCampaigns.length > 0 ? activeCampaigns[0] : null

    if (!latestCampaign) {
      return jsonWithCors(
        {
          success: true,
          campaign: null
        },
        undefined,
        request,
        true
      )
    }

    // 类型断言：getCampaignsByUserId 返回的数据已经转换了字段名
    const campaign = latestCampaign as any

    return jsonWithCors(
      {
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          gameType: campaign.gameType,
          isActive: campaign.isActive,
          prizes: campaign.prizes || [],
          content: campaign.content || {},
          styles: campaign.styles || {}
        }
      },
      undefined,
      request,
      true
    )
  } catch (error) {
    // 确保所有错误响应都有 CORS 头（强制允许所有来源）
    return jsonWithCors(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 },
      request,
      true
    )
  }
}

