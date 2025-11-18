import { useEffect, useState } from "react"
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
import {Card} from "@/components/EnhancePolaris"
import EmptyState from "./components/emptyState"
import { showSuccessToast, showErrorToast } from "@/utils/toast"
import { createDefaultCampaign } from "@/utils/api.campaigns"
import { ApiError } from "@/utils/api.client"

const CampaignsPage = observer(() => {
  const { t } = useTranslation()
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

      // 跳转到活动详情页
      window.location.href = `/campaigns/${campaign.id}`

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

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge tone="warning">Inactive</Badge>
    }

    switch (status) {
      case "active":
        return <Badge tone="success">Active</Badge>
      case "draft":
        return <Badge>Draft</Badge>
      case "paused":
        return <Badge tone="warning">Paused</Badge>
      case "ended":
        return <Badge tone="info">Ended</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getGameTypeName = (gameType: string) => {
    switch (gameType) {
      case "wheel":
        return "Lucky Wheel"
      case "ninebox":
        return "9-Box"
      case "slot":
        return "Slot Machine"
      case "scratch":
        return "Scratch Card.tsx"
      default:
        return gameType
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  const getCampaignsByStatus = () => {
    switch (selectedTab) {
      case 0:
        return campaignStore.campaigns
      case 1:
        return campaignStore.activeCampaigns
      case 2:
        return campaignStore.draftCampaigns
      case 3:
        return campaignStore.pausedCampaigns
      case 4:
        return campaignStore.endedCampaigns
      default:
        return campaignStore.campaigns
    }
  }

  const campaigns = getCampaignsByStatus()

  const rows = campaigns.map((campaign) => [
    campaign.name,
    getGameTypeName(campaign.gameType),
    getStatusBadge(campaign.status, campaign.isActive),
    campaign.totalPlays,
    campaign.totalWins,
    campaign.totalPlays > 0
      ? `${((campaign.totalWins / campaign.totalPlays) * 100).toFixed(1)}%`
      : "0%",
    formatDate(campaign.startAt),
    formatDate(campaign.endAt),
    <InlineStack gap="200">
      <Button
        size="slim"
        onClick={() => {
          window.location.href = `/campaigns/${campaign.id}`
        }}
      >
        View
      </Button>
      <Button
        size="slim"
        onClick={() => {
          window.location.href = `/campaigns/${campaign.id}/analytics`
        }}
      >
        Analytics
      </Button>
    </InlineStack>
  ])

  const tabs = [
    { id: "all", content: `All (${campaignStore.campaigns.length})` },
    { id: "active", content: `Active (${campaignStore.activeCampaigns.length})` },
    { id: "draft", content: `Draft (${campaignStore.draftCampaigns.length})` },
    { id: "paused", content: `Paused (${campaignStore.pausedCampaigns.length})` },
    { id: "ended", content: `Ended (${campaignStore.endedCampaigns.length})` }
  ]

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
            campaigns.length !== 0
              ? <EmptyState />
              : <Card title={"Campaigns library"} titleDivider padding={"0"}>

              </Card>
          }
        </Layout.Section>
      </Layout>
    </Page>
  )
})

export default CampaignsPage

