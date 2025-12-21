import { makeAutoObservable } from "mobx"
import { PlanType } from "@/config/plans"

interface BillingData {
  currentPlan: string
  hasCompletedSubscription: boolean
  isInTrial: boolean
}

class BillingStore {
  currentPlan: string = PlanType.FREE
  hasCompletedSubscription: boolean = false
  isInTrial: boolean = false
  isLoading = false
  error: string | null = null
  isInitialized = false
  lastFetchTime: number | null = null
  cacheDuration = 30000 // 30秒缓存

  constructor() {
    makeAutoObservable(this)
  }

  setBillingData(data: BillingData) {
    this.currentPlan = data.currentPlan || PlanType.FREE
    this.hasCompletedSubscription = data.hasCompletedSubscription || false
    this.isInTrial = data.isInTrial || false
    this.isInitialized = true
    this.lastFetchTime = Date.now()
  }

  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  setError(error: string | null) {
    this.error = error
  }

  /**
   * 检查缓存是否有效
   */
  get isCacheValid(): boolean {
    if (!this.lastFetchTime) return false
    const now = Date.now()
    return (now - this.lastFetchTime) < this.cacheDuration
  }

  /**
   * 获取账单数据
   * @param fetchFn 带认证的 fetch 函数
   * @param forceRefresh 强制刷新，忽略缓存
   */
  async fetchBillingData(
    fetchFn?: (url: string, init?: RequestInit) => Promise<Response>,
    forceRefresh: boolean = false
  ) {
    // 如果已有缓存且未过期，且不是强制刷新，则直接返回
    if (this.isCacheValid && this.isInitialized && !forceRefresh) {
      console.log("⚡️ 使用缓存的 Billing 数据")
      return {
        currentPlan: this.currentPlan,
        hasCompletedSubscription: this.hasCompletedSubscription,
        isInTrial: this.isInTrial
      }
    }

    this.setLoading(true)
    this.setError(null)

    try {
      const fetchToUse = fetchFn || fetch
      const response = await fetchToUse("/api/billing")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      this.setBillingData({
        currentPlan: data.currentPlan || PlanType.FREE,
        hasCompletedSubscription: data.hasCompletedSubscription || false,
        isInTrial: data.isInTrial || false
      })

      return {
        currentPlan: this.currentPlan,
        hasCompletedSubscription: this.hasCompletedSubscription,
        isInTrial: this.isInTrial
      }
    } catch (error) {
      console.error("❌ 加载账单数据失败:", error)
      this.setError(error instanceof Error ? error.message : "Failed to fetch billing data")
      return null
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * 重置 store
   */
  reset() {
    this.currentPlan = PlanType.FREE
    this.hasCompletedSubscription = false
    this.isInTrial = false
    this.isLoading = false
    this.error = null
    this.isInitialized = false
    this.lastFetchTime = null
  }
}

export const billingStore = new BillingStore()

