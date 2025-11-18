import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import {
  apiHandler,
  actionHandler,
  getUserByShop,
  badRequest,
  noContent
} from "@/utils/api.server"
import {
  getCampaignById,
  getCampaignStats,
  updateCampaign,
  deleteCampaign
} from "@/services/campaign.server"

// GET /api/campaigns/:id - 获取活动详情
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  return apiHandler(async () => {
    const { session } = await authenticate.admin(request)
    const { id } = params
    
    if (!id) {
      throw new Error("VALIDATION_Campaign ID is required")
    }
    
    const user = await getUserByShop(session.shop)
    const campaign = await getCampaignById(id, user.id)
    
    if (!campaign) {
      throw new Error("CAMPAIGN_NOT_FOUND")
    }
    
    const stats = getCampaignStats(campaign)
    
    return {
      ...campaign,
      stats: {
        ...stats,
        totalEntries: campaign._count?.lotteryEntries || 0
      }
    }
  })
}

// PUT /DELETE /api/campaigns/:id - 更新/删除活动
export const action = async ({ request, params }: ActionFunctionArgs) => {
  return actionHandler(async () => {
    const { session } = await authenticate.admin(request)
    const { id } = params
    
    if (!id) {
      return badRequest("Campaign ID is required")
    }
    
    const user = await getUserByShop(session.shop)
    const method = request.method
    
    if (method === "DELETE") {
      await deleteCampaign(id, user.id)
      return noContent()
    }
    
    if (method === "PUT") {
      const data = await request.json()
      const updated = await updateCampaign(id, user.id, data)
      return Response.json(updated)
    }
    
    return badRequest("Method not allowed")
  })
}

