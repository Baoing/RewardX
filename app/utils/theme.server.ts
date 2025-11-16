/**
 * Shopify Theme API 工具类
 * 用于检测和管理 Theme App Extensions
 */

interface Theme {
  id: string
  name: string
  role: string
  theme_store_id?: number
  previewable: boolean
  processing: boolean
  created_at: string
  updated_at: string
}

interface ThemeAsset {
  key: string
  value?: string
  public_url?: string
  created_at: string
  updated_at: string
  content_type: string
  size: number
  checksum?: string
  theme_id: number
}

interface AppBlockConfig {
  type: string
  disabled: boolean
  settings?: Record<string, any>
}

interface ThemeSettings {
  current?: {
    blocks?: Record<string, AppBlockConfig>
    [key: string]: any
  }
  [key: string]: any
}

/**
 * 获取当前主题（role: main）
 */
export async function getCurrentTheme(admin: any): Promise<Theme | null> {
  try {
    console.log("🔍 获取当前主题...")

    // 使用 GraphQL 获取主题列表
    const response = await admin.graphql(
      `#graphql
      query getThemes {
        themes(first: 50) {
          nodes {
            id
            name
            role
            createdAt
            updatedAt
          }
        }
      }`
    )

    const data = await response.json()

    if (data.errors) {
      console.error("❌ GraphQL 错误:", data.errors)
      return null
    }

    // 找到 role 为 MAIN 的主题
    const themes = data.data?.themes?.nodes || []
    const mainTheme = themes.find((t: any) => t.role === "MAIN")

    if (!mainTheme) {
      console.warn("⚠️ 未找到主题")
      return null
    }

    // 提取纯数字 ID（去掉 gid://shopify/OnlineStoreTheme/ 前缀）
    const themeId = mainTheme.id.split("/").pop()

    console.log("✅ 找到主题:", mainTheme.name, `ID: ${themeId}`)

    return {
      id: themeId,
      name: mainTheme.name,
      role: mainTheme.role,
      previewable: true,
      processing: false,
      created_at: mainTheme.createdAt,
      updated_at: mainTheme.updatedAt
    }
  } catch (error) {
    console.error("❌ 获取主题失败:", error)
    return null
  }
}

/**
 * 读取主题的 settings_data.json 文件
 */
export async function getThemeSettings(
  admin: any,
  themeId: string,
  session: { shop: string; accessToken: string }
): Promise<ThemeSettings | null> {
  try {
    console.log("📖 读取主题设置:", themeId)
    console.log("🔍 检查 admin.rest 是否存在:", !!admin.rest)

    // 构造完整 URL
    const url = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`
    console.log("🔗 请求URL:", url)
    console.log("🔑 Access Token:", session.accessToken ? `${session.accessToken.substring(0, 10)}...` : "空")

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })

    console.log("📡 响应状态:", response.status)

    if (!response.ok) {
      console.error("❌ 读取主题设置失败:", response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const settingsContent = data.asset?.value

    if (!settingsContent) {
      console.warn("⚠️ 主题设置为空")
      return null
    }

    const settings = JSON.parse(settingsContent)
    console.log("✅ 成功读取主题设置")

    return settings
  } catch (error) {
    console.error("❌ 解析主题设置失败:", error)
    return null
  }
}

/**
 * 更新主题的 settings_data.json 文件
 * 注意：使用 POST 而不是 PUT（避免 404 错误）
 */
export async function updateThemeSettings(
  admin: any,
  themeId: string,
  settings: ThemeSettings,
  session: { shop: string; accessToken: string }
): Promise<boolean> {
  try {
    console.log("💾 更新主题设置:", themeId)

    const payload = {
      asset: {
        key: "config/settings_data.json",
        value: JSON.stringify(settings)
      }
    }

    console.log("📦 Payload size:", JSON.stringify(payload).length, "bytes")

    // 构造完整 URL
    const url = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json`
    console.log("🔗 更新URL:", url)
    console.log("🔑 Access Token:", session.accessToken ? `${session.accessToken.substring(0, 10)}...` : "空")

    // ⚠️ 注意：使用 POST 而不是 PUT（Shopify API 的特殊要求）
    const response = await fetch(url, {
      method: "POST",  // 改用 POST！
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    })

    console.log("📡 响应状态:", response.status)

    if (!response.ok) {
      console.error("❌ 更新主题设置失败:", response.status, response.statusText)

      // 尝试读取响应内容
      let errorData
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = "无法解析错误响应"
      }

      console.error("错误详情:", errorData)

      return false
    }

    console.log("✅ 成功更新主题设置")
    return true
  } catch (error) {
    console.error("❌ 更新主题设置异常:", error)
    return false
  }
}

/**
 * 检查 App Embed 是否已启用
 */
export async function checkAppEmbedEnabled(
  admin: any,
  appApiKey: string,
  session: { shop: string; accessToken: string }
): Promise<{
  isEnabled: boolean
  blockId?: string
  themeId?: string
  themeName?: string
}> {
  try {
    // 1. 获取当前主题
    const theme = await getCurrentTheme(admin)

    if (!theme) {
      return { isEnabled: false }
    }

    // 2. 读取主题设置
    const settings = await getThemeSettings(admin, theme.id, session)

    if (!settings?.current?.blocks) {
      console.log("⚠️ 主题没有 blocks 配置")
      return {
        isEnabled: false,
        themeId: theme.id,
        themeName: theme.name
      }
    }

    // 3. 查找我们的 App Embed Block
    const blocks = settings.current.blocks
    
    console.log("🔍 检查所有 blocks:", Object.keys(blocks))
    console.log("🔑 查找 API Key:", appApiKey)
    
    // 打印所有 block 的详细信息（用于调试）
    console.log("📋 所有 blocks 详情:")
    Object.entries(blocks).forEach(([blockId, block]) => {
      console.log(`  - ${blockId}:`, {
        type: block.type,
        disabled: block.disabled,
        hasApiKey: block.type?.includes(appApiKey),
        hasAppEmbed: block.type?.includes("app-embed") || block.type?.includes("app_embed")
      })
    })
    
    // 查找所有匹配的 App Embed（包括禁用的）
    // 注意：Shopify 可能使用 "app-embed" 或 "app_embed"
    const allAppBlocks = Object.entries(blocks).filter(([blockId, block]) => {
      const typeStr = block.type || ""
      const hasApiKey = typeStr.includes(appApiKey)
      const hasAppEmbed = typeStr.includes("app-embed") || typeStr.includes("app_embed")
      const matches = hasApiKey && hasAppEmbed
      
      if (matches) {
        console.log(`📦 找到 App Embed: ${blockId}`)
        console.log(`   Type: ${block.type}`)
        console.log(`   Disabled: ${block.disabled}`)
      }
      
      return matches
    })
    
    if (allAppBlocks.length === 0) {
      console.log("⚠️ 未找到 App Embed Block")
      return {
        isEnabled: false,
        themeId: theme.id,
        themeName: theme.name
      }
    }
    
    // 查找已启用的（disabled !== true）
    const enabledBlock = allAppBlocks.find(([blockId, block]) => block.disabled !== true)
    
    if (enabledBlock) {
      console.log("✅ App Embed 已启用:", enabledBlock[0])
      return {
        isEnabled: true,
        blockId: enabledBlock[0],
        themeId: theme.id,
        themeName: theme.name
      }
    }
    
    // 找到了 Block 但是被禁用了
    console.log("⚠️ App Embed 存在但被禁用:", allAppBlocks[0][0])
    return {
      isEnabled: false,
      blockId: allAppBlocks[0][0],
      themeId: theme.id,
      themeName: theme.name,
      reason: "App Embed exists but is disabled in theme editor"
    }
  } catch (error) {
    console.error("❌ 检测 App Embed 失败:", error)
    return { isEnabled: false }
  }
}

/**
 * 自动启用 App Embed
 */
export async function enableAppEmbed(
  admin: any,
  appApiKey: string,
  appHandle: string = "smart-seo",
  session: { shop: string; accessToken: string }
): Promise<{ success: boolean; blockId?: string; error?: string }> {
  try {
    console.log("🚀 开始启用 App Embed...")

    // 1. 获取当前主题
    const theme = await getCurrentTheme(admin)

    if (!theme) {
      return {
        success: false,
        error: "No active theme found"
      }
    }

    // 2. 读取当前设置
    const settings = await getThemeSettings(admin, theme.id, session)

    if (!settings) {
      return {
        success: false,
        error: "Failed to read theme settings"
      }
    }

    // 3. 检查是否已启用
    const currentCheck = await checkAppEmbedEnabled(admin, appApiKey, session)
    if (currentCheck.isEnabled) {
      console.log("✅ App Embed 已经启用，无需重复操作")
      return {
        success: true,
        blockId: currentCheck.blockId
      }
    }

    // 4. 初始化 blocks 结构
    if (!settings.current) {
      settings.current = {}
    }
    if (!settings.current.blocks) {
      settings.current.blocks = {}
    }

    // 5. 生成唯一的 block ID
    const blockId = `app-embed-${Date.now()}`

    // 6. 添加 App Embed 配置
    settings.current.blocks[blockId] = {
      type: `shopify://apps/${appHandle}/blocks/app-embed/${appApiKey}`,
      disabled: false,
      settings: {}
    }

    console.log("📝 添加 App Embed 配置:", blockId)

    // 7. 保存更新
    const updateSuccess = await updateThemeSettings(admin, theme.id, settings, session)

    if (!updateSuccess) {
      return {
        success: false,
        error: "Failed to update theme settings"
      }
    }

    console.log("✅ App Embed 启用成功:", blockId)

    return {
      success: true,
      blockId
    }
  } catch (error) {
    console.error("❌ 启用 App Embed 失败:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * 禁用 App Embed
 */
export async function disableAppEmbed(
  admin: any,
  appApiKey: string,
  session: { shop: string; accessToken: string }
): Promise<boolean> {
  try {
    console.log("🔒 开始禁用 App Embed...")

    // 1. 获取当前主题
    const theme = await getCurrentTheme(admin)

    if (!theme) {
      return false
    }

    // 2. 读取当前设置
    const settings = await getThemeSettings(admin, theme.id, session)

    if (!settings?.current?.blocks) {
      return false
    }

    // 3. 找到并删除 App Embed Block
    const blocks = settings.current.blocks
    const appBlockId = Object.keys(blocks).find((blockId) => {
      const block = blocks[blockId]
      return block.type?.includes(appApiKey) && block.type?.includes("app-embed")
    })

    if (!appBlockId) {
      console.log("⚠️ App Embed 未找到，无需禁用")
      return true
    }

    // 删除 block
    delete settings.current.blocks[appBlockId]

    // 4. 保存更新
    const updateSuccess = await updateThemeSettings(admin, theme.id, settings, session)

    if (updateSuccess) {
      console.log("✅ App Embed 已禁用:", appBlockId)
    }

    return updateSuccess
  } catch (error) {
    console.error("❌ 禁用 App Embed 失败:", error)
    return false
  }
}

