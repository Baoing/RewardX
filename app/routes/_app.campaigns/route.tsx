import { useEffect, useState, useRef } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { useNavigate, Outlet, useLocation } from "react-router"
import {
  Page,
  Layout,
  Divider,
  Button,
  Badge,
  InlineStack,
  Text,
  Spinner
} from "@shopify/polaris"
import { PlusIcon } from "@shopify/polaris-icons"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { useCampaignStore } from "@/stores"
import { Card } from "@/components/EnhancePolaris"
import EmptyState from "./components/emptyState"
import CampaignItem from "./components/CampaignItem"
import { showSuccessToast, showErrorToast } from "@/utils/toast"
import { createDefaultCampaign, toggleCampaignStatus, deleteCampaign } from "@/utils/api.campaigns"
import { ApiError } from "@/utils/api.client"
import { authenticate } from "@/shopify.server"

// ✅ 添加 loader 进行 Shopify 认证
// 注意：这个 loader 只做认证，实际数据由前端 MobX store 通过 API 获取
export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("📥 _app.campaigns loader 被调用")
  await authenticate.admin(request)
  return {}
}

// 优化：避免不必要的重新加载
// 注意：React Router v7 的 shouldRevalidate 可能不会在所有情况下被调用
export function shouldRevalidate({
  formAction,
  defaultShouldRevalidate
}: {
  formAction?: string
  defaultShouldRevalidate: boolean
}) {
  console.log("🔍 _app.campaigns shouldRevalidate 被调用:", { formAction, defaultShouldRevalidate })
  // 只有在表单提交时才重新加载
  if (formAction) {
    return true
  }
  // 其他情况使用缓存
  return false
}

const CampaignsPage = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const campaignStore = useCampaignStore()
  const [selectedTab, setSelectedTab] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const appWindowRef = useRef<any>(null)
  
  // 判断是否在子路由（详情页、分析页等）
  const isChildRoute = location.pathname !== "/campaigns"

  useEffect(() => {
    campaignStore.fetchCampaigns()
  }, [])

  // 监听 App Window 关闭事件，刷新列表
  useEffect(() => {
    const appWindow = appWindowRef.current
    if (!appWindow) return

    const handleHide = () => {
      console.log("🔄 App Window closed, refreshing campaigns...")
      campaignStore.fetchCampaigns()
    }

    appWindow.addEventListener("hide", handleHide)
    return () => {
      appWindow.removeEventListener("hide", handleHide)
    }
  }, [campaignStore])

  // 监听来自 App Window 内部的消息（例如删除后的关闭请求）
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "close-app-window") {
        console.log("📩 Received close request from App Window")
        const appWindow = appWindowRef.current
        if (appWindow) {
          appWindow.hide()
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  const handleOpenModal = (campaignId: string) => {
    const appWindow = appWindowRef.current
    if (appWindow) {
      // 设置 App Window 的 src 为详情页路由
      appWindow.src = `/campaigns/${campaignId}`
      // 显示 App Window
      appWindow.show()
      console.log("🚀 Opening App Window for campaign:", campaignId)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      setIsCreating(true)

      // 使用封装的 API 方法创建默认活动
      const campaign = await createDefaultCampaign()

      showSuccessToast("Campaign created successfully!")

      // 刷新活动列表
      await campaignStore.fetchCampaigns()

      // 🎯 打开 App Window 显示新创建的活动
      handleOpenModal(campaign.id)

    } catch (error) {
      console.error("❌ Error creating campaign:", error)

      if (error instanceof ApiError) {
        showErrorToast(error.message)
      } else if (error instanceof Error) {
        showErrorToast(error.message)
      } else {
        showErrorToast("Failed to create campaign")
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await toggleCampaignStatus(id, isActive)
      showSuccessToast(isActive ? "Campaign activated" : "Campaign deactivated")
      await campaignStore.fetchCampaigns()
    } catch (error) {
      console.error("❌ Error toggling campaign status:", error)
      showErrorToast(error instanceof Error ? error.message : "Failed to toggle status")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCampaign(id)
      showSuccessToast("Campaign deleted successfully")
      await campaignStore.fetchCampaigns()
    } catch (error) {
      console.error("❌ Error deleting campaign:", error)
      showErrorToast(error instanceof Error ? error.message : "Failed to delete campaign")
    }
  }

  const campaigns = campaignStore.campaigns

  // ✅ 如果是子路由（详情页、分析页等），直接渲染子路由内容
  if (isChildRoute) {
    return <Outlet />
  }

  // 以下是列表页的内容
  if (campaignStore.isLoading && !campaignStore.isInitialized) {
    return (
      <Page title="Campaigns">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: "40px", textAlign: "center" }}>
                <Spinner size="large" />
                <div style={{ marginTop: "16px" }}>
                  <Text as="p" tone="subdued">
                    Loading campaigns...
                  </Text>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  return (
    <Page
      title="Campaigns"
      primaryAction={{
        content: "Create Campaign",
        icon: PlusIcon,
        loading: isCreating,
        onAction: handleCreateCampaign
      }}
    >
      <Layout>
        <Layout.Section>
          {
            campaigns.length === 0
              ? <EmptyState onCreateCampaign={handleCreateCampaign} isCreating={isCreating} />
              : <Card title="Campaigns library" titleDivider padding="0">
                {campaigns.map((campaign) => (
                  <CampaignItem
                    key={campaign.id}
                    campaign={campaign}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    onCustomize={handleOpenModal}
                  />
                ))}
              </Card>
          }
        </Layout.Section>
      </Layout>

      {/* App Window for Campaign Details */}
      <s-app-window ref={appWindowRef} id="campaign-detail-window" />
    </Page>
  )
})

export default CampaignsPage

