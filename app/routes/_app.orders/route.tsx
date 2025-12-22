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
  BlockStack
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
  const { t } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
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
        showErrorToast(data.error || "获取订单列表失败")
      }
    } catch (error) {
      console.error("❌ 获取订单列表错误:", error)
      showErrorToast("获取订单列表失败")
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
          showSuccessToast(`同步成功：${success}/${total} 个订单已同步`)
          // 刷新订单列表
          await fetchOrders()
        } else {
          showErrorToast("没有新订单需要同步")
        }
        if (failed > 0) {
          console.warn(`⚠️ ${failed} 个订单同步失败`)
        }
      } else {
        showErrorToast(data.error || "同步订单失败")
      }
    } catch (error) {
      console.error("❌ 同步订单错误:", error)
      showErrorToast("同步订单失败")
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [pagination.page])

  // 格式化金额
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    }).format(price / 100) // Shopify 价格以分为单位
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // 获取状态文本和样式
  const getStatusInfo = (status: string | null) => {
    if (!status) return { label: "-", tone: "info" as const }

    const statusMap: Record<string, { label: string; tone: "success" | "warning" | "critical" | "info" }> = {
      paid: { label: "已支付", tone: "success" },
      pending: { label: "待支付", tone: "warning" },
      refunded: { label: "已退款", tone: "critical" },
      fulfilled: { label: "已发货", tone: "success" },
      unfulfilled: { label: "未发货", tone: "warning" },
      partial: { label: "部分发货", tone: "info" }
    }

    return statusMap[status.toLowerCase()] || { label: status, tone: "info" as const }
  }

  // 表格列配置
  const rows = orders.map(order => {
    const financialStatus = getStatusInfo(order.financialStatus)
    const fulfillmentStatus = getStatusInfo(order.fulfillmentStatus)
    
    return [
      order.orderNumber,
      order.customerName || order.email || "-",
      formatPrice(order.totalPrice, order.currencyCode),
      financialStatus.label,
      fulfillmentStatus.label,
      formatDate(order.createdAt)
    ]
  })

  const headings = [
    t("orders.table.orderNumber", "订单号"),
    t("orders.table.customer", "客户"),
    t("orders.table.total", "总金额"),
    t("orders.table.financialStatus", "支付状态"),
    t("orders.table.fulfillmentStatus", "发货状态"),
    t("orders.table.createdAt", "创建时间")
  ]

  return (
    <Page>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h1" variant="headingXl">
            {t("orders.title", "订单管理")}
          </Text>
          <Button
            icon={RefreshIcon}
            onClick={handleSyncOrders}
            loading={syncing}
            variant="primary"
          >
            {syncing ? t("orders.syncing", "同步中...") : t("orders.sync", "同步订单")}
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
                    {t("orders.loading", "加载中...")}
                  </Text>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                heading={t("orders.empty.heading", "暂无订单")}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>{t("orders.empty.description")}</p>
              </EmptyState>
            ) : (
              <BlockStack gap="400">
                <DataTable
                  columnContentTypes={["text", "text", "numeric", "text", "text", "text"]}
                  headings={headings}
                  rows={rows}
                />
                {pagination.totalPages > 1 && (
                  <InlineStack align="center" gap="200">
                    <Button
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      {t("common.previous", "上一页")}
                    </Button>
                    <Text as="p" tone="subdued">
                      {t("common.pageInfo", "第 {page} 页，共 {total} 条", {
                        page: pagination.page,
                        total: pagination.total
                      })}
                    </Text>
                    <Button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      {t("common.next", "下一页")}
                    </Button>
                  </InlineStack>
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

