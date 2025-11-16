import { makeAutoObservable } from "mobx"

export interface Prize {
  id: string
  name: string
  description?: string
  type: string
  discountValue?: number
  discountCode?: string
  giftProductId?: string
  giftVariantId?: string
  chancePercentage: number
  totalStock?: number
  usedStock: number
  displayOrder: number
  color?: string
  icon?: string
  isActive: boolean
}

export interface Campaign {
  id: string
  name: string
  description?: string
  type: string
  gameType: string
  minOrderAmount?: number
  allowedOrderStatus: string
  requireEmail: boolean
  requireName: boolean
  requirePhone: boolean
  maxPlaysPerCustomer?: number
  startAt?: string
  endAt?: string
  status: string
  isActive: boolean
  gameConfig: string
  totalPlays: number
  totalWins: number
  totalOrders: number
  createdAt: string
  updatedAt: string
  prizes: Prize[]
}

export interface LotteryEntry {
  id: string
  campaignId: string
  campaignType: string
  orderId?: string
  orderNumber?: string
  orderAmount?: number
  email?: string
  customerName?: string
  phone?: string
  customerId?: string
  prizeId?: string
  prizeName?: string
  prizeType?: string
  prizeValue?: string
  isWinner: boolean
  status: string
  discountCode?: string
  discountCodeId?: string
  claimedAt?: string
  usedOrderId?: string
  usedOrderAmount?: number
  expiresAt?: string
  createdAt: string
}

export interface CampaignAnalytics {
  summary: {
    pv: number
    uv: number
    totalEntries: number
    totalWins: number
    winRate: number
  }
  dailyStats: Array<{
    date: string
    pv: number
    uv: number
    entries: number
    wins: number
  }>
  prizeStats: Array<{
    prizeId: string
    prizeName: string
    totalWins: number
    totalValue: number
  }>
  orderStats: {
    totalOrders: number
    totalAmount: number
    avgAmount: number
  }
}

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

  async fetchCampaigns() {
    this.setLoading(true)
    this.setError(null)

    try {
      const response = await fetch("/api/campaigns")
      const result = await response.json()

      if (result.success) {
        this.setCampaigns(result.campaigns)
      } else {
        this.setError(result.error || "Failed to fetch campaigns")
      }
    } catch (error) {
      console.error("❌ Failed to fetch campaigns:", error)
      this.setError("Failed to fetch campaigns")
    } finally {
      this.setLoading(false)
    }
  }

  async fetchCampaign(id: string) {
    this.setLoading(true)
    this.setError(null)

    try {
      const response = await fetch(`/api/campaigns/${id}`)
      const result = await response.json()

      if (result.success) {
        this.setCurrentCampaign(result.campaign)
      } else {
        this.setError(result.error || "Failed to fetch campaign")
      }
    } catch (error) {
      console.error("❌ Failed to fetch campaign:", error)
      this.setError("Failed to fetch campaign")
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
    requireEmail?: boolean
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
      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        await this.fetchCampaigns()
        return result.campaign
      } else {
        this.setError(result.error || "Failed to create campaign")
        return null
      }
    } catch (error) {
      console.error("❌ Failed to create campaign:", error)
      this.setError("Failed to create campaign")
      return null
    } finally {
      this.setLoading(false)
    }
  }

  async updateCampaign(id: string, data: Partial<Campaign>) {
    this.setLoading(true)
    this.setError(null)

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        await this.fetchCampaigns()
        return result.campaign
      } else {
        this.setError(result.error || "Failed to update campaign")
        return null
      }
    } catch (error) {
      console.error("❌ Failed to update campaign:", error)
      this.setError("Failed to update campaign")
      return null
    } finally {
      this.setLoading(false)
    }
  }

  async deleteCampaign(id: string) {
    this.setLoading(true)
    this.setError(null)

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE"
      })

      const result = await response.json()

      if (result.success) {
        await this.fetchCampaigns()
        return true
      } else {
        this.setError(result.error || "Failed to delete campaign")
        return false
      }
    } catch (error) {
      console.error("❌ Failed to delete campaign:", error)
      this.setError("Failed to delete campaign")
      return false
    } finally {
      this.setLoading(false)
    }
  }

  async fetchAnalytics(id: string, startDate?: string, endDate?: string) {
    this.setLoading(true)
    this.setError(null)

    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      const url = `/api/campaigns/${id}/analytics${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        this.setCurrentAnalytics(result.analytics)
      } else {
        this.setError(result.error || "Failed to fetch analytics")
      }
    } catch (error) {
      console.error("❌ Failed to fetch analytics:", error)
      this.setError("Failed to fetch analytics")
    } finally {
      this.setLoading(false)
    }
  }

  async fetchEntries(campaignId: string, filters?: {
    isWinner?: boolean
    status?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) {
    this.setLoading(true)
    this.setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.isWinner !== undefined) params.append("isWinner", filters.isWinner.toString())
      if (filters?.status) params.append("status", filters.status)
      if (filters?.startDate) params.append("startDate", filters.startDate)
      if (filters?.endDate) params.append("endDate", filters.endDate)
      if (filters?.limit) params.append("limit", filters.limit.toString())
      if (filters?.offset) params.append("offset", filters.offset.toString())
      
      const url = `/api/campaigns/${campaignId}/entries${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        this.setEntries(result.entries)
      } else {
        this.setError(result.error || "Failed to fetch entries")
      }
    } catch (error) {
      console.error("❌ Failed to fetch entries:", error)
      this.setError("Failed to fetch entries")
    } finally {
      this.setLoading(false)
    }
  }

  async verifyOrder(orderId: string) {
    try {
      const response = await fetch(`/api/lottery/verify-order/${orderId}`)
      const result = await response.json()
      return result
    } catch (error) {
      console.error("❌ Failed to verify order:", error)
      return {
        success: false,
        error: "Failed to verify order"
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
      const response = await fetch("/api/lottery/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!result.success) {
        this.setError(result.error || "Failed to play lottery")
      }

      return result
    } catch (error) {
      console.error("❌ Failed to play lottery:", error)
      this.setError("Failed to play lottery")
      return {
        success: false,
        error: "Failed to play lottery"
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

  get activeCampaigns() {
    return this.campaigns.filter(c => c.isActive && c.status === "active")
  }

  get draftCampaigns() {
    return this.campaigns.filter(c => c.status === "draft")
  }

  get pausedCampaigns() {
    return this.campaigns.filter(c => c.status === "paused")
  }

  get endedCampaigns() {
    return this.campaigns.filter(c => c.status === "ended")
  }
}

export const campaignStore = new CampaignStore()

