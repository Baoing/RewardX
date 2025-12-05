/**
 * CORS 配置
 * 定义哪些 API 路径允许所有来源访问（无跨域限制）
 */

/**
 * 允许所有来源访问的 API 路径白名单
 *
 * 路径匹配规则：
 * - 精确匹配："/api/campaigns/latest"
 * - 前缀匹配："/api/public/" 匹配所有以该前缀开头的路径
 * - 正则匹配：使用 RegExp 对象
 */
export const ALLOW_ALL_ORIGINS_PATHS: (string | RegExp)[] = [
  // 精确匹配
  "/api/campaigns/latest",
  "/api/lottery/play",

  // 可以添加更多路径
  // "/api/public/campaigns",
  // /^\/api\/public\/.*$/, // 正则匹配：所有 /api/public/ 开头的路径
]

/**
 * 检查指定路径是否允许所有来源访问
 *
 * @param path - API 路径（例如："/api/campaigns/latest"）
 * @returns 如果路径在白名单中，返回 true
 */
export const isAllowedAllOrigins = (path: string): boolean => {
  // 规范化路径（移除查询参数和哈希）
  const normalizedPath = path.split("?")[0].split("#")[0]

  return ALLOW_ALL_ORIGINS_PATHS.some((pattern) => {
    // 字符串精确匹配
    if (typeof pattern === "string") {
      return normalizedPath === pattern
    }

    // 正则表达式匹配
    if (pattern instanceof RegExp) {
      return pattern.test(normalizedPath)
    }

    return false
  })
}

/**
 * 添加路径到白名单
 *
 * @param path - 要添加的路径（字符串或正则表达式）
 */
export const addToAllowAllOrigins = (path: string | RegExp): void => {
  if (!ALLOW_ALL_ORIGINS_PATHS.includes(path)) {
    ALLOW_ALL_ORIGINS_PATHS.push(path)
  }
}

/**
 * 从白名单移除路径
 *
 * @param path - 要移除的路径
 */
export const removeFromAllowAllOrigins = (path: string | RegExp): void => {
  const index = ALLOW_ALL_ORIGINS_PATHS.indexOf(path)
  if (index > -1) {
    ALLOW_ALL_ORIGINS_PATHS.splice(index, 1)
  }
}

