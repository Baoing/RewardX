import { useEffect } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { useParams, useNavigate } from "react-router"
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Spinner,
  Divider
} from "@shopify/polaris"
import { observer } from "mobx-react-lite"
import { useCampaignStore } from "@/stores"
import { authenticate } from "@/shopify.server"

// ✅ 添加 loader 进行 Shopify 认证
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  console.log("📍 Campaign Detail Loader called, params:", params)
  
  // Shopify 认证
  await authenticate.admin(request)
  
  // 返回路由参数（实际数据由前端 MobX store 加载）
  return { campaignId: params.id }
}

const CampaignDetailPage = observer(() => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const campaignStore = useCampaignStore()
  const campaign = campaignStore.currentCampaign

  console.log("🎯 CampaignDetailPage rendered, id:", id, "campaign:", campaign?.id)

  useEffect(() => {
    console.log("🔥 useEffect triggered, id:", id)
    if (id) {
      console.log("🔄 Campaign ID changed, fetching new data:", id)
      // 清空当前数据，避免显示旧数据
      campaignStore.setCurrentCampaign(null)
      campaignStore.setEntries([])

      // 获取新数据
      campaignStore.fetchCampaign(id)
      campaignStore.fetchEntries(id)
    }

    // 组件卸载时清空数据
    return () => {
      console.log("🧹 Cleaning up campaign detail page")
      campaignStore.setCurrentCampaign(null)
      campaignStore.setEntries([])
    }
  }, [id, campaignStore])

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
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleString()
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id) return

    const confirmed = window.confirm(`Are you sure you want to change status to ${newStatus}?`)
    if (!confirmed) return

    await campaignStore.updateCampaign(id, { status: newStatus })
  }

  const handleToggleActive = async () => {
    if (!id || !campaign) return

    const newActiveState = !campaign.isActive
    const confirmed = window.confirm(
      `Are you sure you want to ${newActiveState ? "activate" : "deactivate"} this campaign?`
    )
    if (!confirmed) return

    await campaignStore.updateCampaign(id, { isActive: newActiveState })
  }

  const handleDelete = async () => {
    if (!id) return

    const confirmed = window.confirm(
      "Are you sure you want to delete this campaign? This action cannot be undone."
    )
    if (!confirmed) return

    const success = await campaignStore.deleteCampaign(id)
    if (success) {
      navigate("/campaigns")
    }
  }

  if (campaignStore.isLoading && !campaign) {
    return (
      <Page title="Campaign Details">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: "40px", textAlign: "center" }}>
                <Spinner size="large" />
                <div style={{ marginTop: "16px" }}>
                  <Text as="p" tone="subdued">
                    Loading campaign...
                  </Text>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  if (!campaign) {
    return (
      <Page title="Campaign Not Found">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="p">Campaign not found</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  return (
    <Page
      title={campaign.name}
      backAction={{ content: "Campaigns", url: "/campaigns" }}
      secondaryActions={[
        {
          content: campaign.isActive ? "Deactivate" : "Activate",
          onAction: handleToggleActive
        },
        {
          content: "View Analytics",
          onAction: () => {
            navigate(`/campaigns/${id}/analytics`)
          }
        },
        {
          content: "Delete",
          destructive: true,
          onAction: handleDelete
        }
      ]}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Campaign Information
                  </Text>
                  {getStatusBadge(campaign.status, campaign.isActive)}
                </InlineStack>

                <Divider />

                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" tone="subdued">
                      Game Type
                    </Text>
                    <Text as="p" fontWeight="semibold">
                      {getGameTypeName(campaign.gameType)}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="p" tone="subdued">
                      Campaign Type
                    </Text>
                    <Text as="p" fontWeight="semibold">
                      {campaign.type}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="p" tone="subdued">
                      Min Order Amount
                    </Text>
                    <Text as="p" fontWeight="semibold">
                      {campaign.minOrderAmount ? `$${campaign.minOrderAmount}` : "No limit"}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="p" tone="subdued">
                      Max Plays Per Customer
                    </Text>
                    <Text as="p" fontWeight="semibold">
                      {campaign.maxPlaysPerCustomer || "Unlimited"}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="p" tone="subdued">
                      Start Date
                    </Text>
                    <Text as="p" fontWeight="semibold">
                      {formatDate(campaign.startAt)}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="p" tone="subdued">
                      End Date
                    </Text>
                    <Text as="p" fontWeight="semibold">
                      {formatDate(campaign.endAt)}
                    </Text>
                  </InlineStack>
                </BlockStack>

                <Divider />

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Status Actions
                  </Text>
                  <InlineStack gap="200">
                    {campaign.status === "draft" && (
                      <Button onClick={() => handleUpdateStatus("active")}>
                        Publish Campaign
                      </Button>
                    )}
                    {campaign.status === "active" && (
                      <Button onClick={() => handleUpdateStatus("paused")}>
                        Pause Campaign
                      </Button>
                    )}
                    {campaign.status === "paused" && (
                      <Button onClick={() => handleUpdateStatus("active")}>
                        Resume Campaign
                      </Button>
                    )}
                    {campaign.status !== "ended" && (
                      <Button onClick={() => handleUpdateStatus("ended")}>
                        End Campaign
                      </Button>
                    )}
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Statistics
                </Text>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Text as="p" tone="subdued">
                      Total Plays
                    </Text>
                    <Text as="p" variant="headingLg">
                      {campaign.totalPlays}
                    </Text>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Text as="p" tone="subdued">
                      Total Wins
                    </Text>
                    <Text as="p" variant="headingLg">
                      {campaign.totalWins}
                    </Text>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Text as="p" tone="subdued">
                      Win Rate
                    </Text>
                    <Text as="p" variant="headingLg">
                      {campaign.totalPlays > 0
                        ? `${((campaign.totalWins / campaign.totalPlays) * 100).toFixed(1)}%`
                        : "0%"}
                    </Text>
                  </div>
                </div>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Prizes ({campaign.prizes?.length || 0})
                </Text>

                <div className="space-y-2">
                  {(campaign.prizes || []).map((prize) => (
                    <div
                      key={prize.id}
                      className="p-4 border rounded flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        {prize.color && (
                          <div
                            className="w-10 h-10 rounded"
                            style={{ backgroundColor: prize.color }}
                          />
                        )}
                        <div>
                          <Text as="p" fontWeight="semibold">
                            {prize.name}
                          </Text>
                          <Text as="p" tone="subdued" variant="bodySm">
                            {prize.type} • {prize.chancePercentage}% chance
                          </Text>
                          {prize.totalStock && (
                            <Text as="p" tone="subdued" variant="bodySm">
                              Stock: {prize.usedStock}/{prize.totalStock}
                            </Text>
                          )}
                        </div>
                      </div>
                      <Badge tone={prize.isActive ? "success" : undefined}>
                        {prize.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Recent Entries ({campaignStore.entries.length})
                  </Text>
                  <Button
                    onClick={() => {
                      navigate(`/campaigns/${id}/entries`)
                    }}
                  >
                    View All
                  </Button>
                </InlineStack>

                {campaignStore.entries.length === 0 ? (
                  <Text as="p" tone="subdued">
                    No entries yet
                  </Text>
                ) : (
                  <div className="space-y-2">
                    {campaignStore.entries.slice(0, 10).map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 border rounded flex items-center justify-between"
                      >
                        <div>
                          <Text as="p" fontWeight="semibold">
                            {entry.orderNumber || entry.email}
                          </Text>
                          <Text as="p" tone="subdued" variant="bodySm">
                            {new Date(entry.createdAt).toLocaleString()}
                          </Text>
                        </div>
                        <div className="text-right">
                          <Badge tone={entry.isWinner ? "success" : undefined}>
                            {entry.isWinner ? `Won: ${entry.prizeName}` : "No prize"}
                          </Badge>
                          {entry.discountCode && (
                            <Text as="p" variant="bodySm">
                              Code: {entry.discountCode}
                            </Text>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
})

export default CampaignDetailPage

