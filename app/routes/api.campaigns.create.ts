import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import { apiHandler, getUserByShop, created } from "@/utils/api.server"
import { createCampaign } from "@/services/campaign.server"

interface CreateCampaignRequest {
  name: string
  description?: string
  type: "order" | "email_form" | "share"
  gameType: "wheel" | "ninebox" | "slot"
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  requireEmail?: boolean
  requireName?: boolean
  requirePhone?: boolean
  startAt?: string
  endAt?: string
  prizes?: Array<{
    name: string
    type: string
    discountValue?: number
    discountCode?: string
    giftProductId?: string
    giftVariantId?: string
    chancePercentage: number
    totalStock?: number
    displayOrder: number
    color?: string
    icon?: string
  }>
  [key: string]: unknown
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request)
    const user = await getUserByShop(session.shop)
    const data: CreateCampaignRequest = await request.json()
    
    const campaign = await createCampaign(user.id, data)
    
    return created(campaign)
  } catch (error) {
    console.error("❌ Error creating campaign:", error)
    
    // 如果是认证错误，返回 401
    if (error instanceof Error && error.message.includes("authenticate")) {
      return Response.json({ error: "Authentication failed" }, { status: 401 })
    }
    
    // 其他错误返回 500
    return Response.json({
      error: error instanceof Error ? error.message : "Failed to create campaign"
    }, { status: 500 })
  }
}

