/**
 * Campaign API 封装
 * 提供 Campaign 相关的 API 调用方法
 */

import { api } from "./api.client"
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignAnalytics
} from "@/types/campaign"

// ============ API 方法 ============

/**
 * 获取所有活动列表
 */
export const getCampaigns = async (): Promise<Campaign[]> => {
  return api.get<Campaign[]>("/api/campaigns")
}

/**
 * 获取单个活动详情
 */
export const getCampaignById = async (id: string): Promise<Campaign> => {
  return api.get<Campaign>(`/api/campaigns/${id}`)
}

/**
 * 创建活动
 */
export const createCampaign = async (data: CreateCampaignRequest): Promise<Campaign> => {
  return api.post<Campaign>("/api/campaigns/create", data)
}

/**
 * 创建默认的九宫格订单抽奖活动
 */
export const createDefaultCampaign = async (): Promise<Campaign> => {
  const defaultData: CreateCampaignRequest = {
    name: `Lottery Campaign ${new Date().toLocaleDateString()}`,
    description: "Default lottery campaign with order requirement",
    type: "order",
    gameType: "ninebox",
    minOrderAmount: 0,
    maxPlaysPerCustomer: 1,
    requireEmail: true,
    prizes: [
      {
        name: "10% OFF",
        type: "discount_percentage",
        discountValue: 10,
        chancePercentage: 15,
        totalStock: null,
        displayOrder: 0,
        color: "#FFD700",
        icon: "🎁"
      },
      {
        name: "20% OFF",
        type: "discount_percentage",
        discountValue: 20,
        chancePercentage: 10,
        totalStock: null,
        displayOrder: 1,
        color: "#FF6B6B",
        icon: "🎉"
      },
      {
        name: "5% OFF",
        type: "discount_percentage",
        discountValue: 5,
        chancePercentage: 25,
        totalStock: null,
        displayOrder: 2,
        color: "#4ECDC4",
        icon: "🎊"
      },
      {
        name: "No Luck",
        type: "no_prize",
        chancePercentage: 50,
        totalStock: null,
        displayOrder: 3,
        color: "#95A5A6",
        icon: "😔"
      }
    ]
  }

  return createCampaign(defaultData)
}

/**
 * 更新活动
 */
export const updateCampaign = async (
  id: string,
  data: UpdateCampaignRequest
): Promise<Campaign> => {
  return api.put<Campaign>(`/api/campaigns/${id}`, data)
}

/**
 * 删除活动
 */
export const deleteCampaign = async (id: string): Promise<void> => {
  return api.delete<void>(`/api/campaigns/${id}`)
}

/**
 * 激活/停用活动
 */
export const toggleCampaignStatus = async (
  id: string,
  isActive: boolean
): Promise<Campaign> => {
  return api.patch<Campaign>(`/api/campaigns/${id}`, { isActive })
}

/**
 * 获取活动分析数据
 */
export const getCampaignAnalytics = async (id: string): Promise<CampaignAnalytics> => {
  return api.get<CampaignAnalytics>(`/api/campaigns/${id}/analytics`)
}

/**
 * 获取活动抽奖记录
 */
export const getCampaignEntries = async (
  id: string,
  params?: {
    page?: number
    limit?: number
    status?: string
  }
): Promise<{
  entries: unknown[]
  total: number
  page: number
  limit: number
}> => {
  return api.get(`/api/campaigns/${id}/entries`, { params })
}

