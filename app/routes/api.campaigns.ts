import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import { apiHandler, getUserByShop, getStringParam } from "@/utils/api.server"
import { getCampaignsByUserId } from "@/services/campaign.server"

// GET /api/campaigns - 获取活动列表
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return apiHandler(async () => {
    const { session } = await authenticate.admin(request)
    const user = await getUserByShop(session.shop)
    
    const url = new URL(request.url)
    const filters = {
      status: getStringParam(url, "status") || undefined,
      type: getStringParam(url, "type") || undefined,
      gameType: getStringParam(url, "gameType") || undefined
    }
    
    const campaigns = await getCampaignsByUserId(user.id, filters)
    
    return campaigns.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      gameType: c.gameType,
      status: c.status,
      isActive: c.isActive,
      startAt: c.startAt,
      endAt: c.endAt,
      totalPlays: c.totalPlays,
      totalWins: c.totalWins,
      totalOrders: c.totalOrders,
      prizesCount: c._count?.Prize || 0,
      entriesCount: c._count?.LotteryEntry || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }))
  })
}

