/**
 * GET /api/campaigns/latest
 * 获取商店最新的活跃活动（用于 Storefront）
 */
import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import { apiHandler, getUserByShop } from "@/utils/api.server"
import { getCampaignsByUserId } from "@/services/campaign.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return apiHandler(async () => {
    const { session } = await authenticate.admin(request)
    const user = await getUserByShop(session.shop)
    
    // 获取所有活跃的活动，按更新时间倒序排列
    const campaigns = await getCampaignsByUserId(user.id, {})
    
    // 筛选出活跃的活动并按更新时间排序
    const activeCampaigns = campaigns
      .filter(c => c.isActive === true)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    
    // 返回最新的一个活动
    const latestCampaign = activeCampaigns.length > 0 ? activeCampaigns[0] : null
    
    if (!latestCampaign) {
      return {
        success: true,
        campaign: null
      }
    }
    
    // 类型断言：getCampaignsByUserId 返回的数据已经转换了字段名
    const campaign = latestCampaign as any
    
    return {
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
    }
  })
}

