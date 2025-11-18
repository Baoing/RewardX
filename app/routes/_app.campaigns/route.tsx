import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
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

const CampaignsPage = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const campaignStore = useCampaignStore()
  const [selectedTab, setSelectedTab] = useState(0)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    campaignStore.fetchCampaigns()
  }, [])

  const handleCreateCampaign = async () => {
    try {
      setIsCreating(true)

      // 使用封装的 API 方法创建默认活动
      const campaign = await createDefaultCampaign()

      showSuccessToast("Campaign created successfully!")

      // 刷新活动列表
      await campaignStore.fetchCampaigns()

      // 🎯 使用 React Router 导航（不会触发页面刷新和重新认证）
      navigate(`/campaigns/${campaign.id}`)

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
              ? <EmptyState />
              : <Card title="Campaigns library" titleDivider padding="0">
                {campaigns.map((campaign) => (
                  <CampaignItem
                    key={campaign.id}
                    campaign={campaign}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </Card>
          }
        </Layout.Section>
      </Layout>
    </Page>
  )
})

export default CampaignsPage

