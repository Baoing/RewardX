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

  async fetchUserInfo(fetchFn?: (url: string, init?: RequestInit) => Promise<Response>) {
    this.setLoading(true)
    this.setError(null)

    try {
      // 如果提供了 fetch 函数（带认证），使用它；否则使用默认 fetch
      const fetchToUse = fetchFn || fetch
      const response = await fetchToUse("/api/userInfo")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.userInfo) {
        this.setUserInfo(result.userInfo)
        return result.userInfo
      } else {
        this.setError(result.error || "Failed to fetch user info")
        return null
      }
    } catch (error) {
      console.error("❌ Failed to fetch user info:", error)
      this.setError("Failed to fetch user info")
      return null
    } finally {
      this.setLoading(false)
    }
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
        console.log("✅ 语言更新成功，用户信息已刷新")
      } else {
        this.setError(result.error || "Failed to update language")
      }
    } catch (error) {
      console.error("❌ Failed to update language:", error)
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
        console.log("✅ 设置更新成功，用户信息已刷新")
      } else {
        this.setError(result.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("❌ Failed to update settings:", error)
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

