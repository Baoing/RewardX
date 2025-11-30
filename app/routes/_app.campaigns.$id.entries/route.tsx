import { useEffect, useState } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { useParams, useNavigate } from "react-router"
import {
  Page,
  Card,
  DataTable,
  Text,
  Badge,
  Button,
  EmptyState,
  Spinner,
  Pagination,
  Select,
  BlockStack,
  InlineStack
} from "@shopify/polaris"
import { ArrowLeftIcon } from "@shopify/polaris-icons"
import { observer } from "mobx-react-lite"
import { useCampaignStore } from "@/stores"
import { authenticate } from "@/shopify.server"
import type { LotteryEntry } from "@/types/campaign"

// loader 进行 Shopify 认证
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await authenticate.admin(request)
  return { campaignId: params.id }
}

const CampaignEntriesPage = observer(() => {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const campaignStore = useCampaignStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [filterWinner, setFilterWinner] = useState<string>("all") // "all" | "winners" | "losers"
  const [filterStatus, setFilterStatus] = useState<string>("all") // "all" | "pending" | "claimed" | "expired"
  const [isLoading, setIsLoading] = useState(false)
  const [entries, setEntries] = useState<LotteryEntry[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1
  })

  // 获取活动信息
  const campaign = campaignStore.currentCampaign

  // 加载抽奖记录
  const loadEntries = async () => {
    if (!campaignId) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("limit", "50")

      if (filterWinner === "winners") {
        params.append("isWinner", "true")
      } else if (filterWinner === "losers") {
        params.append("isWinner", "false")
      }

      if (filterStatus !== "all") {
        params.append("status", filterStatus)
      }

      const response = await fetch(`/api/campaigns/${campaignId}/entries?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setEntries(data.entries || [])
        setPagination(data.pagination || {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 1
        })
      }
    } catch (error) {
      console.error("❌ Failed to load entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 加载活动信息
  useEffect(() => {
    if (campaignId && !campaign) {
      campaignStore.fetchCampaign(campaignId)
    }
  }, [campaignId, campaign, campaignStore])

  // 加载记录
  useEffect(() => {
    loadEntries()
  }, [campaignId, currentPage, filterWinner, filterStatus])

  // 格式化日期
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-"
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // 格式化金额
  const formatAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "-"
    return `$${amount.toFixed(2)}`
  }

  // 表格列定义
  const rows = entries.map((entry) => {
    const isWinner = entry.isWinner
    const status = entry.status || "pending"

    return [
      // 订单号/邮箱
      entry.orderNumber || entry.order || "-",
      // 客户名称
      entry.customerName || "-",
      // 订单金额
      formatAmount(entry.orderAmount),
      // 中奖状态
      isWinner ? (
        <Badge tone="success">Winner</Badge>
      ) : (
        <Badge>No Prize</Badge>
      ),
      // 奖品名称
      entry.prizeName || "-",
      // 折扣码
      entry.discountCode ? (
        <Text as="span" variant="bodyMd" tone="subdued">
          <code style={{ fontFamily: "monospace" }}>{entry.discountCode}</code>
        </Text>
      ) : (
        "-"
      ),
      // 状态
      <Badge
        tone={
          status === "claimed" ? "success" :
          status === "expired" ? "critical" :
          "info"
        }
      >
        {status}
      </Badge>,
      // 创建时间
      formatDate(entry.createdAt)
    ]
  })

  const headings = [
    "Order/Email",
    "Customer",
    "Amount",
    "Result",
    "Prize",
    "Discount Code",
    "Status",
    "Date"
  ]

  // 筛选选项
  const winnerOptions = [
    { label: "All", value: "all" },
    { label: "Winners Only", value: "winners" },
    { label: "No Prize", value: "losers" }
  ]

  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Claimed", value: "claimed" },
    { label: "Expired", value: "expired" }
  ]

  return (
    <Page
      title={campaign ? `Entries - ${campaign.name}` : "Lottery Entries"}
      backAction={{
        content: "Back to Campaign",
        onAction: () => navigate(`/campaigns/${campaignId}`)
      }}
      primaryAction={{
        content: "View Analytics",
        onAction: () => navigate(`/campaigns/${campaignId}/analytics`)
      }}
    >
      {/* 筛选器 */}
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="400" align="space-between" blockAlign="center">
            <InlineStack gap="400">
              <div style={{ minWidth: "200px" }}>
                <Select
                  label="Filter by Result"
                  options={winnerOptions}
                  value={filterWinner}
                  onChange={setFilterWinner}
                />
              </div>
              <div style={{ minWidth: "200px" }}>
                <Select
                  label="Filter by Status"
                  options={statusOptions}
                  value={filterStatus}
                  onChange={setFilterStatus}
                />
              </div>
            </InlineStack>
            <Text as="p" variant="bodyMd" tone="subdued">
              Total: {pagination.total} entries
            </Text>
          </InlineStack>
        </BlockStack>
      </Card>

      {/* 数据表格 */}
      <Card>
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <Spinner size="large" />
            <div style={{ marginTop: "16px" }}>
              <Text as="p" tone="subdued">Loading entries...</Text>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            heading="No entries found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>No lottery entries match your filters.</p>
          </EmptyState>
        ) : (
          <>
            <DataTable
              columnContentTypes={[
                "text",
                "text",
                "numeric",
                "text",
                "text",
                "text",
                "text",
                "text"
              ]}
              headings={headings}
              rows={rows}
            />
            {pagination.totalPages > 1 && (
              <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
                <Pagination
                  label={`Page ${pagination.page} of ${pagination.totalPages}`}
                  hasPrevious={pagination.page > 1}
                  onPrevious={() => setCurrentPage(p => Math.max(1, p - 1))}
                  hasNext={pagination.page < pagination.totalPages}
                  onNext={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </Page>
  )
})

export default CampaignEntriesPage

