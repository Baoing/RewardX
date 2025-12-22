import { useEffect, useState, useCallback, useMemo } from "react"
import type { LoaderFunctionArgs } from "react-router"
import {
  Page,
  Button,
  InlineStack,
  Text,
  Badge,
  EmptyState,
  Spinner,
  BlockStack,
  IndexTable,
  LegacyCard,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  TextField,
  ChoiceList,
  useBreakpoints
} from "@shopify/polaris"
import type { IndexFiltersProps, TabProps } from "@shopify/polaris"
import { RefreshIcon } from "@shopify/polaris-icons"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { authenticate } from "@/shopify.server"
import { showSuccessToast, showErrorToast } from "@/utils/toast"
import CopyField from "@/components/CopyField"

interface Order {
  id: string
  orderNumber: string
  name: string
  email: string | null
  phone: string | null
  financialStatus: string | null
  fulfillmentStatus: string | null
  totalPrice: number
  currencyCode: string
  customerName: string | null
  customerEmail: string | null
  createdAt: string
  updatedAt: string
  hasLotteryEntry?: boolean
  lotteryEntry?: {
    isWinner: boolean
    prizeName: string | null
    discountCode: string | null
  } | null
}

interface OrdersResponse {
  success: boolean
  data?: {
    orders: Order[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  error?: string
}

interface SyncResponse {
  success: boolean
  results?: {
    total: number
    success: number
    failed: number
    errors: Array<{ orderId: string; error: string }>
  }
  error?: string
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request)
  return {}
}

const OrdersPage = observer(() => {
  const { t, i18n } = useTranslation()
  const breakpoints = useBreakpoints()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0
  })

  // IndexFilters 相关状态
  const [queryValue, setQueryValue] = useState("")
  const [financialStatusFilter, setFinancialStatusFilter] = useState<string[] | undefined>(undefined)
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState<string[] | undefined>(undefined)
  const [lotteryStatusFilter, setLotteryStatusFilter] = useState<string[] | undefined>(undefined)
  const [sortSelected, setSortSelected] = useState(["createdAt desc"])
  const [selectedView, setSelectedView] = useState(0)
  const { mode, setMode } = useSetIndexFiltersMode()

  // 默认视图配置
  const views: TabProps[] = [
    {
      content: t("orders.views.all", "All"),
      id: "all",
      isLocked: true,
      onAction: () => {
        setSelectedView(0)
        setFinancialStatusFilter(undefined)
        setFulfillmentStatusFilter(undefined)
        setLotteryStatusFilter(undefined)
        setQueryValue("")
      }
    },
    {
      content: t("orders.views.paid", "Paid"),
      id: "paid",
      onAction: () => {
        setSelectedView(1)
        setFinancialStatusFilter(["paid"])
        setFulfillmentStatusFilter(undefined)
        setLotteryStatusFilter(undefined)
        setQueryValue("")
      }
    },
    {
      content: t("orders.views.pending", "Pending"),
      id: "pending",
      onAction: () => {
        setSelectedView(2)
        setFinancialStatusFilter(["pending"])
        setFulfillmentStatusFilter(undefined)
        setLotteryStatusFilter(undefined)
        setQueryValue("")
      }
    },
    {
      content: t("orders.views.fulfilled", "Fulfilled"),
      id: "fulfilled",
      onAction: () => {
        setSelectedView(3)
        setFinancialStatusFilter(undefined)
        setFulfillmentStatusFilter(["fulfilled"])
        setLotteryStatusFilter(undefined)
        setQueryValue("")
      }
    },
    {
      content: t("orders.views.unfulfilled", "Unfulfilled"),
      id: "unfulfilled",
      onAction: () => {
        setSelectedView(4)
        setFinancialStatusFilter(undefined)
        setFulfillmentStatusFilter(["unfulfilled"])
        setLotteryStatusFilter(undefined)
        setQueryValue("")
      }
    },
    {
      content: t("orders.views.winners", "Winners"),
      id: "winners",
      onAction: () => {
        setSelectedView(5)
        setFinancialStatusFilter(undefined)
        setFulfillmentStatusFilter(undefined)
        setLotteryStatusFilter(["winner"])
        setQueryValue("")
      }
    }
  ]

  // 获取订单列表
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders?page=${pagination.page}&limit=${pagination.limit}`)
      const data: OrdersResponse = await response.json()

      if (data.success && data.data) {
        setOrders(data.data.orders)
        setPagination(data.data.pagination)
      } else {
        showErrorToast(data.error || t("orders.errors.fetchFailed"))
      }
    } catch (error) {
      console.error("❌ 获取订单列表错误:", error)
      showErrorToast(t("orders.errors.fetchFailed"))
    } finally {
      setLoading(false)
    }
  }

  // 同步订单
  const handleSyncOrders = async () => {
    try {
      setSyncing(true)
      const response = await fetch("/api/orders/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          limit: 100,
          days: 30
        })
      })

      const data: SyncResponse = await response.json()

      if (data.success && data.results) {
        const { total, success, failed } = data.results
        if (success > 0) {
          showSuccessToast(t("orders.syncMessages.success", {
            success,
            total
          }))
          await fetchOrders()
        } else {
          showErrorToast(t("orders.syncMessages.noNewOrders"))
        }
        if (failed > 0) {
          console.warn(`⚠️ ${t("orders.syncMessages.failedCount", { count: failed })}`)
        }
      } else {
        showErrorToast(data.error || t("orders.syncMessages.failed"))
      }
    } catch (error) {
      console.error("❌ 同步订单错误:", error)
      showErrorToast(t("orders.syncMessages.failed"))
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit])

  // 格式化金额
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    }).format(price / 100)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const localeMap: Record<string, string> = {
      "en": "en-US",
      "zh-CN": "zh-CN",
      "zh-TW": "zh-TW",
      "ja": "ja-JP",
      "ko": "ko-KR"
    }
    const locale = localeMap[i18n.language] || "en-US"
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // 获取状态 Badge
  const getStatusBadge = (status: string | null, statusType: "financial" | "fulfillment") => {
    if (!status) return <Badge tone="info">-</Badge>

    const statusKey = status.toLowerCase()
    const translationKey = statusType === "financial"
      ? `orders.status.financial.${statusKey}`
      : `orders.status.fulfillment.${statusKey}`

    const statusMap: Record<string, { tone: "success" | "warning" | "critical" | "info" }> = {
      paid: { tone: "success" },
      pending: { tone: "warning" },
      refunded: { tone: "critical" },
      fulfilled: { tone: "success" },
      unfulfilled: { tone: "warning" },
      partial: { tone: "info" }
    }

    const statusInfo = statusMap[statusKey] || { tone: "info" as const }
    const label = t(translationKey)
    return <Badge tone={statusInfo.tone}>{label}</Badge>
  }

  // 获取抽奖状态 Badge
  const getLotteryBadge = (order: Order) => {
    if (order.hasLotteryEntry) {
      if (order.lotteryEntry?.isWinner) {
        return <Badge tone="success">{t("orders.lottery.winner")}</Badge>
      } else {
        return <Badge tone="info">{t("orders.lottery.played")}</Badge>
      }
    }
    return <Badge>{t("orders.lottery.notPlayed")}</Badge>
  }

  // 筛选和排序订单
  const filteredAndSortedOrders = useCallback(() => {
    let result = [...orders]

    // 搜索筛选
    if (queryValue) {
      const query = queryValue.toLowerCase()
      result = result.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        (order.customerName || "").toLowerCase().includes(query) ||
        (order.email || "").toLowerCase().includes(query)
      )
    }

    // 支付状态筛选
    if (financialStatusFilter && financialStatusFilter.length > 0) {
      result = result.filter(order =>
        order.financialStatus && financialStatusFilter.includes(order.financialStatus.toLowerCase())
      )
    }

    // 发货状态筛选
    if (fulfillmentStatusFilter && fulfillmentStatusFilter.length > 0) {
      result = result.filter(order =>
        order.fulfillmentStatus && fulfillmentStatusFilter.includes(order.fulfillmentStatus.toLowerCase())
      )
    }

    // 抽奖状态筛选
    if (lotteryStatusFilter && lotteryStatusFilter.length > 0) {
      result = result.filter(order => {
        if (lotteryStatusFilter.includes("winner")) {
          return order.lotteryEntry?.isWinner === true
        }
        if (lotteryStatusFilter.includes("played")) {
          return order.hasLotteryEntry && !order.lotteryEntry?.isWinner
        }
        if (lotteryStatusFilter.includes("notPlayed")) {
          return !order.hasLotteryEntry
        }
        return true
      })
    }

    // 排序
    const [sortKey, sortDirection] = sortSelected[0].split(" ")
    result.sort((a, b) => {
      let comparison = 0
      switch (sortKey) {
        case "orderNumber":
          comparison = a.orderNumber.localeCompare(b.orderNumber)
          break
        case "customer":
          comparison = (a.customerName || a.email || "").localeCompare(b.customerName || b.email || "")
          break
        case "total":
          comparison = a.totalPrice - b.totalPrice
          break
        case "createdAt":
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        default:
          comparison = 0
      }
      return sortDirection === "desc" ? -comparison : comparison
    })

    return result
  }, [orders, queryValue, financialStatusFilter, fulfillmentStatusFilter, lotteryStatusFilter, sortSelected, t])

  const displayOrders = filteredAndSortedOrders()

  // 计算每个视图的订单数量
  const getViewCount = useCallback((viewId: string) => {
    let count = 0
    switch (viewId) {
      case "all":
        count = orders.length
        break
      case "paid":
        count = orders.filter(order => order.financialStatus?.toLowerCase() === "paid").length
        break
      case "pending":
        count = orders.filter(order => order.financialStatus?.toLowerCase() === "pending").length
        break
      case "fulfilled":
        count = orders.filter(order => order.fulfillmentStatus?.toLowerCase() === "fulfilled").length
        break
      case "unfulfilled":
        count = orders.filter(order => order.fulfillmentStatus?.toLowerCase() === "unfulfilled").length
        break
      case "winners":
        count = orders.filter(order => order.lotteryEntry?.isWinner === true).length
        break
      default:
        count = 0
    }
    return count
  }, [orders])

  // 更新视图配置，添加数量显示
  const viewsWithCount: TabProps[] = useMemo(() => {
    return views.map(view => ({
      ...view,
      content: `${view.content} (${getViewCount(view.id || "")})`
    }))
  }, [getViewCount])

  // IndexFilters 配置
  const sortOptions: IndexFiltersProps["sortOptions"] = [
    { label: t("orders.table.orderNumber"), value: "orderNumber asc", directionLabel: "A-Z" },
    { label: t("orders.table.orderNumber"), value: "orderNumber desc", directionLabel: "Z-A" },
    { label: t("orders.table.customer"), value: "customer asc", directionLabel: "A-Z" },
    { label: t("orders.table.customer"), value: "customer desc", directionLabel: "Z-A" },
    { label: t("orders.table.total"), value: "total asc", directionLabel: t("orders.sort.ascending", "Ascending") },
    { label: t("orders.table.total"), value: "total desc", directionLabel: t("orders.sort.descending", "Descending") },
    { label: t("orders.table.createdAt"), value: "createdAt asc", directionLabel: t("orders.sort.oldest", "Oldest first") },
    { label: t("orders.table.createdAt"), value: "createdAt desc", directionLabel: t("orders.sort.newest", "Newest first") }
  ]

  const filters: IndexFiltersProps["filters"] = [
    {
      key: "financialStatus",
      label: t("orders.table.financialStatus"),
      filter: (
        <ChoiceList
          title={t("orders.table.financialStatus")}
          titleHidden
          choices={[
            { label: t("orders.status.financial.paid"), value: "paid" },
            { label: t("orders.status.financial.pending"), value: "pending" },
            { label: t("orders.status.financial.refunded"), value: "refunded" }
          ]}
          selected={financialStatusFilter || []}
          onChange={setFinancialStatusFilter}
          allowMultiple
        />
      ),
      shortcut: true
    },
    {
      key: "fulfillmentStatus",
      label: t("orders.table.fulfillmentStatus"),
      filter: (
        <ChoiceList
          title={t("orders.table.fulfillmentStatus")}
          titleHidden
          choices={[
            { label: t("orders.status.fulfillment.fulfilled"), value: "fulfilled" },
            { label: t("orders.status.fulfillment.unfulfilled"), value: "unfulfilled" },
            { label: t("orders.status.fulfillment.partial"), value: "partial" }
          ]}
          selected={fulfillmentStatusFilter || []}
          onChange={setFulfillmentStatusFilter}
          allowMultiple
        />
      ),
      shortcut: true
    },
    {
      key: "lotteryStatus",
      label: t("orders.table.lotteryStatus"),
      filter: (
        <ChoiceList
          title={t("orders.table.lotteryStatus")}
          titleHidden
          choices={[
            { label: t("orders.lottery.winner"), value: "winner" },
            { label: t("orders.lottery.played"), value: "played" },
            { label: t("orders.lottery.notPlayed"), value: "notPlayed" }
          ]}
          selected={lotteryStatusFilter || []}
          onChange={setLotteryStatusFilter}
          allowMultiple
        />
      ),
      shortcut: true
    }
  ]

  const appliedFilters: IndexFiltersProps["appliedFilters"] = []
  if (financialStatusFilter && financialStatusFilter.length > 0) {
    appliedFilters.push({
      key: "financialStatus",
      label: `${t("orders.table.financialStatus")}: ${financialStatusFilter.map(s => t(`orders.status.financial.${s}`)).join(", ")}`,
      onRemove: () => setFinancialStatusFilter(undefined)
    })
  }
  if (fulfillmentStatusFilter && fulfillmentStatusFilter.length > 0) {
    appliedFilters.push({
      key: "fulfillmentStatus",
      label: `${t("orders.table.fulfillmentStatus")}: ${fulfillmentStatusFilter.map(s => t(`orders.status.fulfillment.${s}`)).join(", ")}`,
      onRemove: () => setFulfillmentStatusFilter(undefined)
    })
  }
  if (lotteryStatusFilter && lotteryStatusFilter.length > 0) {
    appliedFilters.push({
      key: "lotteryStatus",
      label: `${t("orders.table.lotteryStatus")}: ${lotteryStatusFilter.map(s => {
        if (s === "winner") return t("orders.lottery.winner")
        if (s === "played") return t("orders.lottery.played")
        return t("orders.lottery.notPlayed")
      }).join(", ")}`,
      onRemove: () => setLotteryStatusFilter(undefined)
    })
  }

  const handleFiltersClearAll = useCallback(() => {
    setSelectedView(0)
    setFinancialStatusFilter(undefined)
    setFulfillmentStatusFilter(undefined)
    setLotteryStatusFilter(undefined)
    setQueryValue("")
  }, [])

  const resourceName = {
    singular: t("orders.resource.singular", "order"),
    plural: t("orders.resource.plural", "orders")
  }

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(
    displayOrders as unknown as Array<{ [key: string]: unknown }>
  )

  const rowMarkup = displayOrders.map((order, index) => (
    <IndexTable.Row
      id={order.id}
      key={order.id}
      selected={selectedResources.includes(order.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {order.orderNumber}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{order.customerName || order.email || "-"}</IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {formatPrice(order.totalPrice, order.currencyCode)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{getStatusBadge(order.financialStatus, "financial")}</IndexTable.Cell>
      <IndexTable.Cell>{getStatusBadge(order.fulfillmentStatus, "fulfillment")}</IndexTable.Cell>
      <IndexTable.Cell>{getLotteryBadge(order)}</IndexTable.Cell>
      <IndexTable.Cell>
        <CopyField
          copyValue={order.lotteryEntry?.discountCode || undefined}
          toolTipText={t("common.copy")}
          config={{ hover: true }}
        >
          {order.lotteryEntry?.discountCode || "-"}
        </CopyField>
      </IndexTable.Cell>
      <IndexTable.Cell>{formatDate(order.createdAt)}</IndexTable.Cell>
    </IndexTable.Row>
  ))

  return (
    <Page fullWidth>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h1" variant="headingXl">
            {t("orders.title")}
          </Text>
          <Button
            icon={RefreshIcon}
            onClick={handleSyncOrders}
            loading={syncing}
            variant="primary"
          >
            {syncing ? t("orders.syncing") : t("orders.sync")}
          </Button>
        </InlineStack>

        <LegacyCard>
          <IndexFilters
            sortOptions={sortOptions}
            sortSelected={sortSelected}
            queryValue={queryValue}
            queryPlaceholder={t("orders.search.placeholder", "Search orders")}
            onQueryChange={setQueryValue}
            onQueryClear={() => setQueryValue("")}
            onSort={setSortSelected}
            tabs={viewsWithCount}
            selected={selectedView}
            onSelect={setSelectedView}
            filters={filters}
            appliedFilters={appliedFilters}
            onClearAll={handleFiltersClearAll}
            mode={mode}
            setMode={setMode}
          />

          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <Spinner size="large" />
              <div style={{ marginTop: "1rem" }}>
                <Text as="p" tone="subdued">
                  {t("orders.loading")}
                </Text>
              </div>
            </div>
          ) : displayOrders.length === 0 ? (
            <EmptyState
              heading={t("orders.empty.heading")}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>{t("orders.empty.description")}</p>
            </EmptyState>
          ) : (
            <>
              <IndexTable
                condensed={breakpoints.smDown}
                resourceName={resourceName}
                itemCount={displayOrders.length}
                selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: t("orders.table.orderNumber") },
                  { title: t("orders.table.customer") },
                  { title: t("orders.table.total"), alignment: "end" },
                  { title: t("orders.table.financialStatus") },
                  { title: t("orders.table.fulfillmentStatus") },
                  { title: t("orders.table.lotteryStatus") },
                  { title: t("orders.table.discountCode") },
                  { title: t("orders.table.createdAt") }
                ]}
              >
                {rowMarkup}
              </IndexTable>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center" style={{ padding: "1rem" }}>
                  <Button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    {t("orders.pagination.previous")}
                  </Button>
                  <div style={{ margin: "0 1rem" }}>
                    <Text as="p" tone="subdued">
                      {t("orders.pagination.label", {
                        page: pagination.page,
                        totalPages: pagination.totalPages
                      })}
                    </Text>
                  </div>
                  <Button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    {t("orders.pagination.next")}
                  </Button>
                </div>
              )}
            </>
          )}
        </LegacyCard>
      </BlockStack>
    </Page>
  )
})

export default OrdersPage
