/**
 * 应用全局配置
 * 
 * 优先级：环境变量 > 默认值
 */

/**
 * 从环境变量获取配置，支持运行时和构建时
 */
const getEnvVar = (key: string, defaultValue: string): string => {
  // 尝试从 process.env 获取（服务端）
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string
  }
  
  // 尝试从 import.meta.env 获取（Vite 构建时，客户端）
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string
  }
  
  return defaultValue
}

/**
 * 获取布尔类型的环境变量
 */
const getEnvBool = (key: string, defaultValue: boolean): boolean => {
  const value = getEnvVar(key, String(defaultValue))
  return value === "true" || value === "1" || value === "yes"
}

/**
 * 获取环境标识
 */
export const getEnv = (): string => {
  return getEnvVar("VITE_APP_ENV", getEnvVar("NODE_ENV", "development"))
}

/**
 * 应用全局配置对象
 */
export const APP_CONFIG = {
  // 环境信息
  env: getEnv(),
  isDev: getEnv() === "local" || getEnv() === "development",
  isTest: getEnv() === "test",
  isProd: getEnv() === "production",
  
  // 应用基本信息
  name: getEnvVar("APP_NAME", "RewardX – Spin, Win name: getEnvVar("APP_NAME", "Smart SEO") Repeat"),
  version: getEnvVar("APP_VERSION", "1.0.0"),
  description: "A Shopify app built with React Router",
  
  // 应用作者信息
  author: {
    name: getEnvVar("APP_AUTHOR_NAME", "RewardX"),
    email: getEnvVar("APP_AUTHOR_EMAIL", "will@baoea.com")
  },
  
  // 默认配置
  defaults: {
    language: getEnvVar("VITE_DEFAULT_LANG", "zh"),
    theme: getEnvVar("VITE_DEFAULT_THEME", "light"),
    timezone: "Asia/Shanghai"
  },
  
  // 功能开关
  features: {
    analytics: getEnvBool("VITE_ENABLE_ANALYTICS", true),
    notifications: getEnvBool("VITE_ENABLE_NOTIFICATIONS", true),
    multiLanguage: getEnvBool("VITE_ENABLE_MULTI_LANGUAGE", true),
    debug: getEnvBool("VITE_DEBUG_MODE", false)
  },
  
  // 第三方服务配置
  services: {
    intercom: {
      appId: getEnvVar("VITE_INTERCOM_APP_ID", ""),
      uidPrefix: getEnvVar("VITE_INTERCOM_UID_PREFIX", "smart_seo_")
    },
    analytics: {
      gaTrackingId: getEnvVar("VITE_GA_TRACKING_ID", "")
    },
    sentry: {
      dsn: getEnvVar("VITE_SENTRY_DSN", "")
    }
  }
} as const

/**
 * 获取应用名称
 */
export const getAppName = (): string => APP_CONFIG.name

/**
 * 获取应用版本
 */
export const getAppVersion = (): string => APP_CONFIG.version

/**
 * 获取应用描述
 */
export const getAppDescription = (): string => APP_CONFIG.description

/**
 * 获取应用作者信息
 */
export const getAppAuthor = () => APP_CONFIG.author

/**
 * 获取默认配置
 */
export const getDefaults = () => APP_CONFIG.defaults

/**
 * 检查功能是否启用
 */
export const isFeatureEnabled = (feature: keyof typeof APP_CONFIG.features): boolean => {
  return APP_CONFIG.features[feature]
}

/**
 * 获取完整的应用配置
 */
export const getAppConfig = () => APP_CONFIG

/**
 * 获取第三方服务配置
 */
export const getServiceConfig = (service: keyof typeof APP_CONFIG.services) => {
  return APP_CONFIG.services[service]
}

/**
 * 检查是否为开发环境
 */
export const isDevelopment = (): boolean => APP_CONFIG.isDev

/**
 * 检查是否为生产环境
 */
export const isProduction = (): boolean => APP_CONFIG.isProd

/**
 * 检查是否启用调试模式
 */
export const isDebugMode = (): boolean => APP_CONFIG.features.debug

/**
 * 获取 App Embed UUID（用于主题编辑器深度链接）
 * 这个 UUID 在每个店铺中是固定的，可以从主题编辑器 URL 中获取
 * 格式: app_embed_uuid=019a5713-34ac-7374-be08-ce36cc3f79f1
 */
export const getAppEmbedUuid = (): string | null => {
  return getEnvVar("APP_EMBED_UUID", "") || null
}
