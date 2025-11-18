import { useEffect, useState, useCallback } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { useParams, useNavigate } from "react-router"
import {
  Button,
  Spinner,
  Text,
  TextField,
  Select,
  Checkbox
} from "@shopify/polaris"
import { DesktopIcon, MobileIcon } from "@shopify/polaris-icons"
import { observer } from "mobx-react-lite"
import { useCampaignStore } from "@/stores"
import { authenticate } from "@/shopify.server"
import { showToast } from "@/utils/toast"
import styles from "./styles.module.scss"

// loader 进行 Shopify 认证
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
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

  // 标签状态
  const [activeTab, setActiveTab] = useState<"rules" | "design" | "prizes">("rules")
  // 预览设备状态
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")

  // 删除活动
  const handleDelete = useCallback(async () => {
    if (!id) return

    const confirmed = window.confirm(
      "Are you sure you want to delete this campaign? This action cannot be undone."
    )
    if (!confirmed) return

    const success = await campaignStore.deleteCampaign(id)
    if (success) {
      // 如果在 App Window 中，通知父窗口关闭
      // 通过检查是否在 iframe 中来判断
      if (window.parent !== window) {
        console.log("🔄 Closing App Window after delete")
        // 触发 App Window 的 hide 事件（父窗口会监听并刷新列表）
        window.parent.postMessage({ type: "close-app-window" }, "*")
      } else {
        // 如果不在 App Window 中，正常导航
        navigate("/campaigns")
      }
    }
  }, [id, campaignStore, navigate])

  useEffect(() => {
    if (id) {
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

  // 为 s-button 添加全局方法
  useEffect(() => {
    // @ts-ignore
    window.saveCampaign = () => {
      console.log("💾 Saving campaign...")
      // TODO: Implement save logic
      showToast({ content: "Campaign saved (Coming soon)" })
    }

    // @ts-ignore
    window.deleteCampaign = () => {
      handleDelete()
    }

    return () => {
      // @ts-ignore
      delete window.saveCampaign
      // @ts-ignore
      delete window.deleteCampaign
    }
  }, [handleDelete])

  // 渲染左侧配置面板的内容
  const renderSidebarContent = () => {
    if (!campaign) return null

    switch (activeTab) {
      case "rules":
        return (
          <div className={styles.content}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Publish Campaign
              </div>
              <Checkbox
                label="Make this campaign live"
                checked={campaign.isActive}
                onChange={(checked) => {
                  if (id) {
                    campaignStore.updateCampaign(id, { isActive: checked })
                  }
                }}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Campaign Name
              </div>
              <TextField
                label=""
                value={campaign.name}
                onChange={(value) => {
                  if (id) {
                    campaignStore.updateCampaign(id, { name: value })
                  }
                }}
                autoComplete="off"
                maxLength={50}
              />
              <div className={styles.sectionDescription}>
                Only visible to you, not shown to customers
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Campaign Type
              </div>
              <Select
                label=""
                options={[
                  { label: "Order Lottery", value: "order_lottery" },
                  { label: "Email Subscribe", value: "email_subscribe" }
                ]}
                value={campaign.type}
                onChange={(value) => {
                  if (id) {
                    campaignStore.updateCampaign(id, { type: value })
                  }
                }}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Min Order Amount
              </div>
              <TextField
                label=""
                type="number"
                value={campaign.minOrderAmount?.toString() || ""}
                onChange={(value) => {
                  if (id) {
                    campaignStore.updateCampaign(id, {
                      minOrderAmount: value ? parseFloat(value) : undefined
                    })
                  }
                }}
                prefix="$"
                autoComplete="off"
              />
              <div className={styles.sectionDescription}>
                Minimum order amount required to play
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Max Plays Per Customer
              </div>
              <TextField
                label=""
                type="number"
                value={campaign.maxPlaysPerCustomer?.toString() || ""}
                onChange={(value) => {
                  if (id) {
                    campaignStore.updateCampaign(id, {
                      maxPlaysPerCustomer: value ? parseInt(value) : undefined
                    })
                  }
                }}
                autoComplete="off"
              />
              <div className={styles.sectionDescription}>
                Leave empty for unlimited plays
              </div>
            </div>
          </div>
        )

      case "design":
        return (
          <div className={styles.content}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Game Type
              </div>
              <Select
                label=""
                options={[
                  { label: "9-Box", value: "ninebox" },
                  { label: "Lucky Wheel", value: "wheel" },
                  { label: "Slot Machine", value: "slot" },
                  { label: "Scratch Card", value: "scratch" }
                ]}
                value={campaign.gameType}
                onChange={(value) => {
                  if (id) {
                    campaignStore.updateCampaign(id, { gameType: value })
                  }
                }}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Theme Colors
              </div>
              <Text as="p" tone="subdued">
                Customize colors (Coming soon)
              </Text>
            </div>
          </div>
        )

      case "prizes":
        return (
          <div className={styles.content}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Prize Configuration
              </div>
              <div className={styles.sectionDescription}>
                Total Prizes: {campaign.prizes?.length || 0}
              </div>
              <Button onClick={() => { /* TODO: Add prize modal */ }}>
                Add Prize
              </Button>
            </div>

            {campaign.prizes && campaign.prizes.length > 0 && (
              <div className={styles.section}>
                {campaign.prizes.map((prize) => (
                  <div key={prize.id} style={{ padding: "12px", border: "1px solid #e1e3e5", borderRadius: "8px", marginBottom: "8px" }}>
                    <Text as="p" fontWeight="semibold">{prize.name}</Text>
                    <Text as="p" tone="subdued">{prize.type} - {prize.chancePercentage}%</Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (campaignStore.isLoading && !campaign) {
    return (
      <div className={styles.campaignEditor}>
        {/* @ts-ignore */}
        <s-page heading="Campaign Details">
          <div style={{ padding: "40px", textAlign: "center" }}>
            <Spinner size="large" />
            <div style={{ marginTop: "16px" }}>
              <Text as="p" tone="subdued">
                Loading campaign...
              </Text>
            </div>
          </div>
        </s-page>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className={styles.campaignEditor}>
        {/* @ts-ignore */}
        <s-page heading="Campaign Not Found">
          <div style={{ padding: "40px" }}>
            <Text as="p">Campaign not found</Text>
          </div>
        </s-page>
      </div>
    )
  }

  return (
    <div className={styles.campaignEditor}>
      {/* @ts-ignore */}
      <s-page heading={campaign.name} style={{ height: "100%", display: "flex", flexDirection: "column", padding: 0, margin: 0 }}>
        {/* 主操作按钮 */}
        {/* @ts-ignore */}
        <s-button slot="primary-action" onclick="window.saveCampaign()">
          Save
        </s-button>
        
        {/* 次要操作按钮 */}
        {/* @ts-ignore */}
        <s-button slot="secondary-actions" onclick="window.deleteCampaign()">
          Delete
        </s-button>
        
        {/* 编辑器容器 */}
        <div className={styles.campaignEditor__container} style={{ flex: 1, margin: 0, padding: 0 }}>
          {/* 左侧配置面板 */}
          <div className={styles.campaignEditor__sidebar}>
            {/* 标签切换 */}
            <div className={styles.tabs}>
              <div className={styles.tabList}>
                <button
                  className={`${styles.tabButton} ${activeTab === "rules" ? styles.active : ""}`}
                  onClick={() => setActiveTab("rules")}
                >
                  Rules
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === "design" ? styles.active : ""}`}
                  onClick={() => setActiveTab("design")}
                >
                  Design
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === "prizes" ? styles.active : ""}`}
                  onClick={() => setActiveTab("prizes")}
                >
                  Prizes
                </button>
              </div>
                  </div>

            {/* 配置内容 */}
            {renderSidebarContent()}
                  </div>

          {/* 右侧预览区域 */}
          <div className={styles.campaignEditor__preview}>
            {/* 预览工具栏 */}
            <div className={styles.previewToolbar}>
              <div className={styles.deviceToggle}>
                <button
                  className={previewDevice === "desktop" ? styles.active : ""}
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <DesktopIcon />
                </button>
                <button
                  className={previewDevice === "mobile" ? styles.active : ""}
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <MobileIcon />
                </button>
                        </div>
                      </div>

            {/* 预览内容 */}
            <div className={styles.previewContent}>
              <div className={`${styles.previewWrapper} ${styles[previewDevice]}`}>
                <div className={styles.gameCanvas}>
                  <Text as="p" variant="bodyLg" tone="subdued">
                    Game Preview ({campaign.gameType})
                  </Text>
                  <Text as="p" tone="subdued">
                    Coming soon
                  </Text>
                </div>
              </div>
                        </div>
                        </div>
                      </div>
      </s-page>
                  </div>
  )
})

export default CampaignDetailPage
