import { useEffect, useState } from "react"
import { useParams } from "react-router"
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Spinner,
  TextField,
  Button
} from "@shopify/polaris"
import { observer } from "mobx-react-lite"
import { useCampaignStore } from "../../stores"

const CampaignAnalyticsPage = observer(() => {
  const { id } = useParams<{ id: string }>()
  const campaignStore = useCampaignStore()
  const analytics = campaignStore.currentAnalytics
  const campaign = campaignStore.currentCampaign
  
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (id) {
      campaignStore.fetchCampaign(id)
      campaignStore.fetchAnalytics(id)
    }
  }, [id])

  const handleFilterAnalytics = () => {
    if (id) {
      campaignStore.fetchAnalytics(id, startDate || undefined, endDate || undefined)
    }
  }

  const handleResetFilter = () => {
    setStartDate("")
    setEndDate("")
    if (id) {
      campaignStore.fetchAnalytics(id)
    }
  }

  if (campaignStore.isLoading && !analytics) {
    return (
      <Page title="Campaign Analytics">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: "40px", textAlign: "center" }}>
                <Spinner size="large" />
                <div style={{ marginTop: "16px" }}>
                  <Text as="p" tone="subdued">
                    Loading analytics...
                  </Text>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  if (!analytics) {
    return (
      <Page title="Analytics Not Available">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="p">Analytics data not available</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  return (
    <Page
      title={`Analytics: ${campaign?.name || "Campaign"}`}
      backAction={{ content: "Back to Campaign", url: `/campaigns/${id}` }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Date Filter
                </Text>
                <InlineStack gap="400" align="start">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={setStartDate}
                      autoComplete="off"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={setEndDate}
                      autoComplete="off"
                    />
                  </div>
                  <div style={{ paddingTop: "28px" }}>
                    <InlineStack gap="200">
                      <Button onClick={handleFilterAnalytics}>Apply Filter</Button>
                      <Button onClick={handleResetFilter}>Reset</Button>
                    </InlineStack>
                  </div>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Overview
                </Text>
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <Text as="p" tone="subdued">
                      Page Views (PV)
                    </Text>
                    <Text as="p" variant="headingLg">
                      {analytics.summary.pv.toLocaleString()}
                    </Text>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded">
                    <Text as="p" tone="subdued">
                      Unique Visitors (UV)
                    </Text>
                    <Text as="p" variant="headingLg">
                      {analytics.summary.uv.toLocaleString()}
                    </Text>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded">
                    <Text as="p" tone="subdued">
                      Total Entries
                    </Text>
                    <Text as="p" variant="headingLg">
                      {analytics.summary.totalEntries.toLocaleString()}
                    </Text>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded">
                    <Text as="p" tone="subdued">
                      Total Wins
                    </Text>
                    <Text as="p" variant="headingLg">
                      {analytics.summary.totalWins.toLocaleString()}
                    </Text>
                  </div>

                  <div className="text-center p-4 bg-red-50 rounded">
                    <Text as="p" tone="subdued">
                      Win Rate
                    </Text>
                    <Text as="p" variant="headingLg">
                      {analytics.summary.winRate.toFixed(1)}%
                    </Text>
                  </div>
                </div>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Daily Statistics
                </Text>
                {analytics.dailyStats.length === 0 ? (
                  <Text as="p" tone="subdued">
                    No data available for the selected period
                  </Text>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-right p-2">PV</th>
                          <th className="text-right p-2">UV</th>
                          <th className="text-right p-2">Entries</th>
                          <th className="text-right p-2">Wins</th>
                          <th className="text-right p-2">Win Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.dailyStats.map((stat) => (
                          <tr key={stat.date} className="border-b hover:bg-gray-50">
                            <td className="p-2">{stat.date}</td>
                            <td className="text-right p-2">{stat.pv.toLocaleString()}</td>
                            <td className="text-right p-2">{stat.uv.toLocaleString()}</td>
                            <td className="text-right p-2">{stat.entries.toLocaleString()}</td>
                            <td className="text-right p-2">{stat.wins.toLocaleString()}</td>
                            <td className="text-right p-2">
                              {stat.entries > 0
                                ? `${((stat.wins / stat.entries) * 100).toFixed(1)}%`
                                : "0%"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Prize Statistics
                </Text>
                {analytics.prizeStats.length === 0 ? (
                  <Text as="p" tone="subdued">
                    No prizes won yet
                  </Text>
                ) : (
                  <div className="space-y-2">
                    {analytics.prizeStats.map((stat, index) => (
                      <div
                        key={stat.prizeId || index}
                        className="p-4 border rounded flex items-center justify-between"
                      >
                        <div>
                          <Text as="p" fontWeight="semibold">
                            {stat.prizeName}
                          </Text>
                          <Text as="p" tone="subdued" variant="bodySm">
                            Total Wins: {stat.totalWins.toLocaleString()}
                          </Text>
                        </div>
                        <div className="text-right">
                          <Text as="p" variant="headingMd">
                            ${stat.totalValue.toFixed(2)}
                          </Text>
                          <Text as="p" tone="subdued" variant="bodySm">
                            Total Value
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Order Statistics
                </Text>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Text as="p" tone="subdued">
                      Total Orders
                    </Text>
                    <Text as="p" variant="headingLg">
                      {analytics.orderStats.totalOrders.toLocaleString()}
                    </Text>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Text as="p" tone="subdued">
                      Total Amount
                    </Text>
                    <Text as="p" variant="headingLg">
                      ${analytics.orderStats.totalAmount.toFixed(2)}
                    </Text>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Text as="p" tone="subdued">
                      Average Order
                    </Text>
                    <Text as="p" variant="headingLg">
                      ${analytics.orderStats.avgAmount.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
})

export default CampaignAnalyticsPage

