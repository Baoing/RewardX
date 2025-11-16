import { useEffect, useState } from "react"
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Badge,
  BlockStack,
  InlineStack,
  Text,
  EmptyState,
  Spinner
} from "@shopify/polaris"
import { PlusIcon } from "@shopify/polaris-icons"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { useCampaignStore } from "../../stores"

const CampaignsPage = observer(() => {
  const { t } = useTranslation()
  const campaignStore = useCampaignStore()
  const [selectedTab, setSelectedTab] = useState(0)

  useEffect(() => {
    campaignStore.fetchCampaigns()
  }, [])

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
        return "Scratch Card"
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
        onAction: () => {
          window.location.href = "/campaigns/create"
        }
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <div className="tabs-container">
                {tabs.map((tab, index) => (
                  <Button
                    key={tab.id}
                    pressed={selectedTab === index}
                    onClick={() => setSelectedTab(index)}
                  >
                    {tab.content}
                  </Button>
                ))}
              </div>

              {campaigns.length === 0 ? (
                <EmptyState
                  heading="No campaigns found"
                  action={{
                    content: "Create your first campaign",
                    onAction: () => {
                      window.location.href = "/campaigns/create"
                    }
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Create a lottery campaign to engage your customers</p>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={[
                    "text",
                    "text",
                    "text",
                    "numeric",
                    "numeric",
                    "text",
                    "text",
                    "text",
                    "text"
                  ]}
                  headings={[
                    "Campaign Name",
                    "Game Type",
                    "Status",
                    "Total Plays",
                    "Total Wins",
                    "Win Rate",
                    "Start Date",
                    "End Date",
                    "Actions"
                  ]}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
})

export default CampaignsPage

