import { useEffect, useState } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { useParams, useNavigate, useLocation, Outlet } from "react-router"
import {
  Button,
  ButtonGroup,
  Spinner,
  Text,
  Tabs
} from "@shopify/polaris"
import { DesktopIcon, MobileIcon, XIcon } from "@shopify/polaris-icons"
import { observer } from "mobx-react-lite"
import { useCampaignStore, useCampaignEditorStore } from "@/stores"
import { authenticate } from "@/shopify.server"
import { showToast } from "@/utils/toast"
import RulesTab from "./components/RulesTab"
import ContentTab from "./components/ContentTab"
import StylesTab from "./components/StylesTab"
import PreviewGame from "@/plugin/component/PreviewGame"
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
  const location = useLocation()
  const campaignStore = useCampaignStore()
  const editorStore = useCampaignEditorStore()
  const campaign = campaignStore.currentCampaign

  // 判断是否是子路由（entries, analytics 等）
  const isChildRoute = location.pathname !== `/campaigns/${id}` &&
    (location.pathname.includes("/entries") || location.pathname.includes("/analytics"))

  // 标签状态 (使用索引)
  const [selectedTab, setSelectedTab] = useState(0)
  // 预览设备状态
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")

  // 定义标签页
  const tabs = [
    {
      id: "rules",
      content: "Rules",
      panelID: "rules-panel"
    },
    {
      id: "content",
      content: "Content",
      panelID: "content-panel"
    },
    {
      id: "styles",
      content: "Styles",
      panelID: "styles-panel"
    }
  ]

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
      campaignStore.fetchCampaign(id).then(() => {
        // 初始化编辑器
        if (campaignStore.currentCampaign) {
          editorStore.initEditor(campaignStore.currentCampaign)
        }
      })
      campaignStore.fetchEntries(id)
    }

    // 组件卸载时清空数据
    return () => {
      console.log("🧹 Cleaning up campaign detail page")
      campaignStore.setCurrentCampaign(null)
      campaignStore.setEntries([])
      editorStore.resetEditor()
    }
  }, [id, campaignStore, editorStore])

  // 渲染左侧配置面板的内容
  const renderSidebarContent = () => {
    switch (selectedTab) {
      case 0: // Rules
        return <RulesTab />
      case 1: // Content
        return <ContentTab />
      case 2: // Styles
        return <StylesTab />
      default:
        return null
    }
  }

  // 处理保存
  const handleSave = async () => {
    if (!id || !editorStore.hasUnsavedChanges) return

    editorStore.setIsSaving(true)
    try {
      const changes = editorStore.changedFields
      const success = await campaignStore.updateCampaign(id, changes)

      if (success) {
        editorStore.markSaved()
        showToast({ content: "Campaign saved successfully" })
      }
    } catch (error) {
      console.error("Failed to save campaign:", error)
      showToast({ content: "Failed to save campaign", error: true })
    } finally {
      editorStore.setIsSaving(false)
  }
  }

  // 处理撤销
  const handleDiscard = () => {
    editorStore.discardChanges()
    showToast({ content: "Changes discarded" })
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

  // 如果是子路由，直接渲染子路由内容
  if (isChildRoute) {
    return <Outlet />
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
            <Button
              size={"large"}
              onClick={handleDiscard}
              disabled={!editorStore.hasUnsavedChanges}
            >
              Discard
            </Button>
            <Button
              size={"large"}
              variant="primary"
              onClick={handleSave}
              disabled={!editorStore.hasUnsavedChanges}
              loading={editorStore.isSaving}
            >
              Save
            </Button>

            <Button
              size={"large"}
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
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} fitted />
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
              <PreviewGame isAdmin={true} />
            </div>
          </div>
       </div>
      </div>
    </div>
  )
})

export default CampaignDetailPage
