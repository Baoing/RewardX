import {makeAutoObservable} from "mobx"
import {
  deleteCampaign,
  getCampaignAnalytics,
  getCampaignById,
  getCampaignEntries,
  getCampaigns,
  updateCampaign
} from "@/utils/api.campaigns"
import {api, ApiError} from "@/utils/api.client"
import type {Campaign, CampaignAnalytics, LotteryEntry, Prize} from "@/types/campaign"

// Re-export types for backward compatibility
export type { Campaign, Prize, LotteryEntry, CampaignAnalytics }

class CampaignStore {
  campaigns: Campaign[] = []
  currentCampaign: Campaign | null = null
  currentAnalytics: CampaignAnalytics | null = null
  entries: LotteryEntry[] = []

  isLoading = false
  error: string | null = null

  isInitialized = false

  constructor() {
    makeAutoObservable(this)
  }

  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  setError(error: string | null) {
    this.error = error
  }

  setCampaigns(campaigns: Campaign[]) {
    this.campaigns = campaigns
    this.isInitialized = true
  }

  setCurrentCampaign(campaign: Campaign | null) {
    this.currentCampaign = campaign
  }

  setCurrentAnalytics(analytics: CampaignAnalytics | null) {
    this.currentAnalytics = analytics
  }

  setEntries(entries: LotteryEntry[]) {
    this.entries = entries
  }

  private lastFetchTime: number = 0
  private readonly CACHE_DURATION = 5000 // 5 秒缓存

  async fetchCampaigns(force = false) {
    // 如果已经有缓存且未过期，且不是强制刷新，则跳过
    const now = Date.now()
    if (!force && this.isInitialized && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      console.log("⚡️ 使用缓存的 Campaign 数据")
      return
    }

    this.setLoading(true)
    this.setError(null)

    try {
      const campaigns = await getCampaigns()
      this.setCampaigns(campaigns)
      this.lastFetchTime = now
    } catch (error) {
      console.error("❌ Failed to fetch campaigns:", error)
      const message = error instanceof ApiError ? error.message : "Failed to fetch campaigns"
      this.setError(message)
    } finally {
      this.setLoading(false)
    }
  }

  async fetchCampaign(id: string) {
    this.setLoading(true)
    this.setError(null)

    try {
      const campaign = await getCampaignById(id)
      this.setCurrentCampaign(campaign)
    } catch (error) {
      console.error("❌ Failed to fetch campaign:", error)
      const message = error instanceof ApiError ? error.message : "Failed to fetch campaign"
      this.setError(message)
    } finally {
      this.setLoading(false)
    }
  }

  async createCampaign(data: {
    name: string
    description?: string
    type?: string
    gameType?: string
    minOrderAmount?: number
    allowedOrderStatus?: string
    requireOrder?: boolean
    requireName?: boolean
    requirePhone?: boolean
    maxPlaysPerCustomer?: number
    startAt?: string
    endAt?: string
    prizes: Array<{
      name: string
      description?: string
      type: string
      discountValue?: number
      chancePercentage: number
      totalStock?: number
      displayOrder: number
      color?: string
      icon?: string
    }>
  }) {
    this.setLoading(true)
    this.setError(null)

    try {
      const campaign = await api.post<Campaign>("/api/campaigns/create", data)
      await this.fetchCampaigns()
      return campaign
    } catch (error) {
      console.error("❌ Failed to create campaign:", error)
      const message = error instanceof ApiError ? error.message : "Failed to create campaign"
      this.setError(message)
      return null
    } finally {
      this.setLoading(false)
    }
  }

  async updateCampaign(id: string, data: Partial<Campaign>) {
    this.setLoading(true)
    this.setError(null)

    try {
      const campaign = await updateCampaign(id, data)
      await this.fetchCampaigns()
      return campaign
    } catch (error) {
      console.error("❌ Failed to update campaign:", error)
      const message = error instanceof ApiError ? error.message : "Failed to update campaign"
      this.setError(message)
      return null
    } finally {
      this.setLoading(false)
    }
  }

  async deleteCampaign(id: string) {
    this.setLoading(true)
    this.setError(null)

    try {
      await deleteCampaign(id)
      await this.fetchCampaigns()
      return true
    } catch (error) {
      console.error("❌ Failed to delete campaign:", error)
      const message = error instanceof ApiError ? error.message : "Failed to delete campaign"
      this.setError(message)
      return false
    } finally {
      this.setLoading(false)
    }
  }

  async fetchAnalytics(id: string, startDate?: string, endDate?: string) {
    this.setLoading(true)
    this.setError(null)

    try {
      const analytics = await getCampaignAnalytics(id)
      this.setCurrentAnalytics(analytics)
    } catch (error) {
      console.error("❌ Failed to fetch analytics:", error)
      const message = error instanceof ApiError ? error.message : "Failed to fetch analytics"
      this.setError(message)
    } finally {
      this.setLoading(false)
    }
  }

  async fetchEntries(campaignId: string, filters?: {
    isWinner?: boolean
    status?: string
    startDate?: string
    endDate?: string
  }) {
    this.setLoading(true)
    this.setError(null)

    try {
      const result = await getCampaignEntries(campaignId, {
        status: filters?.status
      })
      this.setEntries(result.entries as LotteryEntry[])
    } catch (error) {
      console.error("❌ Failed to fetch entries:", error)
      const message = error instanceof ApiError ? error.message : "Failed to fetch entries"
      this.setError(message)
    } finally {
      this.setLoading(false)
    }
  }

  async verifyOrder(orderId: string) {
    try {
      return await api.get(`/api/lottery/verify-order/${orderId}`)
    } catch (error) {
      console.error("❌ Failed to verify order:", error)
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Failed to verify order"
      }
    }
  }

  async playLottery(data: {
    campaignId: string
    orderId: string
  }) {
    this.setLoading(true)
    this.setError(null)

    try {
      const result = await api.post("/api/lottery/play", data)

      if (!(result as { success: boolean }).success) {
        const error = (result as { error?: string }).error || "Failed to play lottery"
        this.setError(error)
      }

      return result
    } catch (error) {
      console.error("❌ Failed to play lottery:", error)
      const message = error instanceof ApiError ? error.message : "Failed to play lottery"
      this.setError(message)
      return {
        success: false,
        error: message
      }
    } finally {
      this.setLoading(false)
    }
  }

  reset() {
    this.campaigns = []
    this.currentCampaign = null
    this.currentAnalytics = null
    this.entries = []
    this.isLoading = false
    this.error = null
    this.isInitialized = false
  }

  // ✅ 简化：只基于 isActive 筛选
  get activeCampaigns() {
    return this.campaigns.filter(c => c.isActive)
  }

  get inactiveCampaigns() {
    return this.campaigns.filter(c => !c.isActive)
  }
}

export const campaignStore = new CampaignStore()

