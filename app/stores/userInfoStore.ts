import { makeAutoObservable } from "mobx"
import type { UserInfo } from "../utils/user.server"

class UserInfoStore {
  userInfo: UserInfo | null = null
  isLoading = false
  error: string | null = null
  
  // 🔥 新增：初始化状态标记
  isInitialized = false

  constructor() {
    makeAutoObservable(this)
  }

  /**
   * 设置用户信息（只在首次或需要更新时调用）
   */
  setUserInfo(userInfo: UserInfo | null) {
    this.userInfo = userInfo
    
    // 标记为已初始化
    if (userInfo && !this.isInitialized) {
      this.isInitialized = true
      console.log("✅ UserInfo 已初始化")
    }
  }

  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  setError(error: string | null) {
    this.error = error
  }
  
  /**
   * 重置初始化状态（用于登出或重新登录）
   */
  reset() {
    this.userInfo = null
    this.isLoading = false
    this.error = null
    this.isInitialized = false
  }

  async updateLanguage(language: string) {
    if (!this.userInfo) return

    this.setLoading(true)
    this.setError(null)

    try {
      // language 参数已经是 Shopify 格式（zh-CN），直接保存
      const formData = new FormData()
      formData.append("appLanguage", language)

      const response = await fetch("/api/updateUser", {
        method: "POST",
        body: formData
      })

      const result = await response.json()

      if (result.success && result.userInfo) {
        this.setUserInfo(result.userInfo)
      } else {
        this.setError(result.error || "Failed to update language")
      }
    } catch (error) {
      console.error("Failed to update language:", error)
      this.setError("Failed to update language")
    } finally {
      this.setLoading(false)
    }
  }

  async updateSettings(settings: Record<string, any>) {
    if (!this.userInfo) return

    this.setLoading(true)
    this.setError(null)

    try {
      const formData = new FormData()
      formData.append("settings", JSON.stringify(settings))

      const response = await fetch("/api/updateUser", {
        method: "POST",
        body: formData
      })

      const result = await response.json()

      if (result.success && result.userInfo) {
        this.setUserInfo(result.userInfo)
      } else {
        this.setError(result.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Failed to update settings:", error)
      this.setError("Failed to update settings")
    } finally {
      this.setLoading(false)
    }
  }

  get currentLanguage() {
    return this.userInfo?.appLanguage || "zh-CN"
  }

  get settings() {
    return this.userInfo?.settings || {}
  }

  get metadata() {
    return this.userInfo?.metadata || {}
  }

  get isShopifyPlus() {
    return this.userInfo?.isShopifyPlus || false
  }

  get theme() {
    return this.userInfo?.theme || "light"
  }
}

export const userInfoStore = new UserInfoStore()

