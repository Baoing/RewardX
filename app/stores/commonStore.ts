import { makeAutoObservable } from "mobx"
import i18n from "../i18n/config"
import type { ShopInfo } from "../utils/shop.server"

export type ShopifyLanguageCode =
  | "en"
  | "zh-CN"
  | "zh-TW"
  | "cs"
  | "da"
  | "nl"
  | "fi"
  | "fr"
  | "de"
  | "it"
  | "ja"
  | "ko"
  | "nb"
  | "pl"
  | "pt-BR"
  | "pt-PT"
  | "es"
  | "sv"
  | "th"
  | "tr"

/**
 * 公共状态管理 Store
 * 用于存储全局共享数据：语言、店铺信息等
 */
class CommonStore {
  // 当前语言（直接使用 Shopify 标准代码）
  // 初始化时从 i18n 同步，避免闪烁
  currentLanguage: ShopifyLanguageCode

  // 店铺信息（从 Shopify Admin API 获取，不存数据库）
  shopInfo: ShopInfo | null = null

  // 🔥 新增：初始化状态标记
  isShopInfoInitialized = false
  isLanguageInitialized = false

  constructor() {
    // 从 i18n 获取当前语言作为初始值
    const i18nLang = i18n.language as ShopifyLanguageCode
    this.currentLanguage = i18nLang || "en"

    makeAutoObservable(this)
  }

  // ============ 语言管理 ============

  /**
   * 设置语言（Shopify 格式）
   * 直接同步到 i18n，无需映射
   */
  setLanguage(shopifyLangCode: ShopifyLanguageCode) {
    this.currentLanguage = shopifyLangCode

    // i18n 现在也使用 Shopify 标准代码，直接切换
    if (i18n.language !== shopifyLangCode) {
      i18n.changeLanguage(shopifyLangCode)
    }

    // 标记为已初始化
    if (!this.isLanguageInitialized) {
      this.isLanguageInitialized = true
    }
  }

  /**
   * 从 i18n 同步语言状态
   */
  syncLanguageFromI18n() {
    const i18nLang = i18n.language as ShopifyLanguageCode
    if (this.currentLanguage !== i18nLang) {
      this.currentLanguage = i18nLang
    }
  }

  // ============ 店铺信息管理 ============

  /**
   * 设置店铺信息
   * 店铺信息不存数据库，每次从 Shopify API 实时获取
   */
  setShopInfo(shopInfo: ShopInfo | null) {
    this.shopInfo = shopInfo

    // 标记为已初始化
    if (shopInfo && !this.isShopInfoInitialized) {
      this.isShopInfoInitialized = true
    }
  }

  /**
   * 清空店铺信息
   */
  clearShopInfo() {
    this.shopInfo = null
  }

  /**
   * 重置初始化状态（用于登出或重新登录）
   */
  reset() {
    this.shopInfo = null
    this.isShopInfoInitialized = false
    this.isLanguageInitialized = false
  }

  /**
   * 检查是否全部初始化完成
   */
  get isFullyInitialized() {
    return this.isShopInfoInitialized && this.isLanguageInitialized
  }
}

export const commonStore = new CommonStore()

