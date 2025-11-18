import { useEffect, useState } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { useParams, useNavigate } from "react-router"
import {
  Button,
  ButtonGroup,
  Spinner,
  Text,
  TextField,
  Select,
  Checkbox
} from "@shopify/polaris"
import { DesktopIcon, MobileIcon, XIcon } from "@shopify/polaris-icons"
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

  // 🔥 处理关闭操作
  const handleClose = () => {
    // 检测是否在 Modal/弹窗中打开
    if (typeof window !== "undefined") {
      // 如果是通过 window.open 打开的弹窗
      if (window.opener) {
        window.close()
        return
      }

      // 检查 URL 参数是否标记为 modal
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("modal") === "1") {
        window.close()
        return
      }
    }

    navigate("/campaigns")
  }

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
        <div className={styles.campaignEditor__header}>
          <div className={styles.campaignEditor__headerContent}>
            <h1 className={styles.campaignEditor__title}>Campaign Details</h1>
          </div>
        </div>
        <div style={{ padding: "40px", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <Spinner size="large" />
            <div style={{ marginTop: "16px" }}>
              <Text as="p" tone="subdued">
                Loading campaign...
              </Text>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className={styles.campaignEditor}>
        <div className={styles.campaignEditor__header}>
          <div className={styles.campaignEditor__headerContent}>
            <h1 className={styles.campaignEditor__title}>Campaign Not Found</h1>
          </div>
        </div>
        <div style={{ padding: "40px", flex: 1 }}>
          <Text as="p">Campaign not found</Text>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.campaignEditor}>
      {/* 自定义标题栏 */}
      <div className={styles.campaignEditor__header}>
        <div className={styles.campaignEditor__headerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 className={styles.campaignEditor__title}>{campaign.name}</h1>
          </div>
          <div className={styles.campaignEditor__actions}>
            <Button disabled={true}>
              Discard
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                console.log("💾 Saving campaign...")
                showToast({ content: "Campaign saved (Coming soon)" })
              }}
            >
              Save
            </Button>

            <Button
              icon={XIcon}
              variant={"tertiary"}
              onClick={handleClose}
              accessibilityLabel="Close"
            />
          </div>
        </div>
      </div>

      {/* 编辑器容器 */}
      <div className={styles.campaignEditor__container}>
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
            <ButtonGroup variant="segmented">
              <Button
                icon={DesktopIcon}
                size={"large"}
                pressed={previewDevice === "desktop"}
                onClick={() => setPreviewDevice("desktop")}
                accessibilityLabel="Desktop preview"
              />
              <Button
                size={"large"}
                icon={MobileIcon}
                pressed={previewDevice === "mobile"}
                onClick={() => setPreviewDevice("mobile")}
                accessibilityLabel="Mobile preview"
              />
            </ButtonGroup>
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
    </div>
  )
})

export default CampaignDetailPage
