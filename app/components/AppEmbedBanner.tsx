import { useState, useEffect } from "react"
import { Banner, BlockStack, Text, Button, InlineStack } from "@shopify/polaris"
import { useTranslation } from "react-i18next"
import { getAppEmbedUuid } from "@/config/app.config"

export function AppEmbedBanner() {
  const { t } = useTranslation()
  const [isEmbedEnabled, setIsEmbedEnabled] = useState<boolean | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [appEmbedUuid, setAppEmbedUuid] = useState<string | null>(null)

  useEffect(() => {
    // 检查是否已经被忽略
    const dismissed = localStorage.getItem("appEmbedBannerDismissed")
    if (dismissed === "true") {
      setIsDismissed(true)
      setIsChecking(false)
      return
    }

    // 检查 App Embed 状态
    // checkAppEmbedStatus()
  }, [])

  const checkAppEmbedStatus = async () => {
    try {
      setIsChecking(true)
      const response = await fetch("/api/checkAppEmbed")
      const data = await response.json()

      console.log("🔍 App Embed 完整状态:", data)

      if (data.isEnabled === true) {
        console.log("✅ App Embed 已启用")
        setIsEmbedEnabled(true)
      } else if (data.isEnabled === false) {
        console.log("⚠️ App Embed 未启用")

        // 检查是否是因为被禁用
        if (data.reason) {
          console.warn("📋 原因:", data.reason)
        }

        // 如果找到了 blockId，说明 App Embed 存在但被禁用
        if (data.blockId) {
          console.warn("⚠️ App Embed 存在但被禁用，Block ID:", data.blockId)
        }

        setIsEmbedEnabled(false)
      } else {
        console.warn("⚠️ 无法检测 App Embed 状态")
        setIsEmbedEnabled(null)
      }

      // 提取 UUID（如果存在）
      if (data.blockId) {
        console.log("📦 Block ID:", data.blockId)
      }

      // 从 themeId 和其他信息推断或获取 UUID
      if (data.themeId) {
        console.log("🎨 Theme ID:", data.themeId)
        console.log("🎨 Theme Name:", data.themeName)
      }

      // 尝试从响应中获取 UUID
      if (data.uuid) {
        setAppEmbedUuid(data.uuid)
        console.log("🔑 App Embed UUID:", data.uuid)
      }
    } catch (error) {
      console.error("Failed to check app embed status:", error)
      setIsEmbedEnabled(null)
    } finally {
      setIsChecking(false)
    }
  }

  // 注释掉自动启用功能（需要特殊权限）
  // const handleAutoEnable = async () => {
  //   setIsEnabling(true)
  //   setError(null)

  //   try {
  //     const response = await fetch("/api/checkAppEmbed", {
  //       method: "POST"
  //     })

  //     const data = await response.json()

  //     if (data.success) {
  //       console.log("✅ App Embed 已自动启用:", data.blockId)
  //       setIsEmbedEnabled(true)

  //       // 显示成功后自动隐藏 Banner
  //       setTimeout(() => {
  //         setIsDismissed(true)
  //       }, 2000)
  //     } else {
  //       setError(data.error || "Failed to enable app embed")
  //       console.error("❌ 启用失败:", data.error)
  //     }
  //   } catch (error) {
  //     setError("Network error. Please try again.")
  //     console.error("❌ 网络错误:", error)
  //   } finally {
  //     setIsEnabling(false)
  //   }
  // }

  const handleManualEnable = () => {
    // 打开 Shopify 主题编辑器并自动激活 App Embed
    const shopOrigin = (window as any).shopify?.config?.shop || ""

    // 优先级：API 动态获取 > 配置文件 > 硬编码
    const uuid = appEmbedUuid || getAppEmbedUuid() || "019a5713-34ac-7374-be08-ce36cc3f79f1"

    if (shopOrigin && uuid) {
      // 使用正确的格式：activateAppId={uuid}/app-embed
      // app-embed 对应 blocks/app-embed.liquid 文件
      const editorUrl = `https://${shopOrigin}/admin/themes/current/editor?context=apps&activateAppId=${uuid}/app-embed`

      console.log("📝 跳转到主题编辑器并自动打开 App Embed:", editorUrl)
      console.log("🔑 UUID 来源:", appEmbedUuid ? "API" : (getAppEmbedUuid() ? "配置文件" : "硬编码"))

      // 直接跳转（不使用 window.open 避免被浏览器拦截）
      window.top!.location.href = editorUrl
    } else {
      console.error("❌ 无法获取 shop 或 App Embed UUID 信息")

      // 降级方案：只打开 App Embeds 页面
      if (shopOrigin) {
        const fallbackUrl = `https://${shopOrigin}/admin/themes/current/editor?context=apps`
        console.log("📝 跳转到主题编辑器（降级方案）:", fallbackUrl)
        window.top!.location.href = fallbackUrl
      }
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    // 保存到 localStorage（7天后重新提示）
    localStorage.setItem("appEmbedBannerDismissed", "true")
    localStorage.setItem("appEmbedBannerDismissedAt", Date.now().toString())
    console.log("⏰ Banner 已忽略，7天后重新提示")
  }

  // 如果正在检测，不显示任何内容（避免闪烁）
  if (isChecking) {
    return null
  }

  // 如果已启用、已忽略或检测失败，不显示 Banner
  if (isEmbedEnabled === true || isDismissed || isEmbedEnabled === null) {
    return null
  }

  return (
    <Banner
      title={t("appEmbed.title")}
      tone="warning"
      onDismiss={handleDismiss}
    >
      <BlockStack gap="300">
        <Text as="p" variant="bodyMd">
          {t("appEmbed.description")}
        </Text>

        <InlineStack gap="300" blockAlign="center">
          <Button
            variant="primary"
            onClick={handleManualEnable}
          >
            {t("appEmbed.manualEnableButton")}
          </Button>
          <Button onClick={handleDismiss}>
            {t("appEmbed.dismissButton")}
          </Button>
        </InlineStack>
      </BlockStack>
    </Banner>
  )
}

