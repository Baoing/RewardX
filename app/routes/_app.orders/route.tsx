import { useEffect, useState } from "react"
import type { LoaderFunctionArgs } from "react-router"
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  InlineStack,
  Text,
  Badge,
  EmptyState,
  Spinner,
  BlockStack,
  Pagination
} from "@shopify/polaris"
import { RefreshIcon } from "@shopify/polaris-icons"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { authenticate } from "@/shopify.server"
import { showSuccessToast, showErrorToast } from "@/utils/toast"

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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0
  })

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
          // 刷新订单列表
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
    }).format(price / 100) // Shopify 价格以分为单位
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    // 根据当前语言设置 locale
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

  // 表格列配置
  const rows = orders.map(order => {
    return [
      order.orderNumber,
      order.customerName || order.email || "-",
      formatPrice(order.totalPrice, order.currencyCode),
      getStatusBadge(order.financialStatus, "financial"),
      getStatusBadge(order.fulfillmentStatus, "fulfillment"),
      getLotteryBadge(order),
      order.lotteryEntry?.discountCode || "-",
      formatDate(order.createdAt)
    ]
  })

  const headings = [
    t("orders.table.orderNumber"),
    t("orders.table.customer"),
    t("orders.table.total"),
    t("orders.table.financialStatus"),
    t("orders.table.fulfillmentStatus"),
    t("orders.table.lotteryStatus"),
    t("orders.table.discountCode"),
    t("orders.table.createdAt")
  ]

  return (
    <Page>
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
      <Layout>
        <Layout.Section>
          <Card>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <Spinner size="large" />
                <div style={{ marginTop: "1rem" }}>
                  <Text as="p" tone="subdued">
                    {t("orders.loading")}
                  </Text>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                heading={t("orders.empty.heading")}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>{t("orders.empty.description")}</p>
              </EmptyState>
            ) : (
              <BlockStack gap="400">
                <DataTable
                  columnContentTypes={["text", "text", "numeric", "text", "text", "text", "text", "text"]}
                  headings={headings}
                  rows={rows}
                />
                {pagination.totalPages > 1 && (
                  <Pagination
                    hasPrevious={pagination.page > 1}
                    onPrevious={() => {
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                    }}
                    hasNext={pagination.page < pagination.totalPages}
                    onNext={() => {
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                    }}
                    label={t("orders.pagination.label", {
                      page: pagination.page,
                      totalPages: pagination.totalPages
                    })}
                  />
                )}
              </BlockStack>
            )}
          </Card>
        </Layout.Section>
      </Layout>
      </BlockStack>
    </Page>
  )
})

export default OrdersPage

