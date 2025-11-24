import { observer } from "mobx-react-lite"
import {
  Select,
  TextField,
  Checkbox,
  BlockStack,
  Button,
  Text,
  Divider
} from "@shopify/polaris"
import { useCampaignEditorStore, useCampaignStore } from "@/stores"
import { useParams } from "react-router"
import { showToast } from "@/utils/toast"
import PrizeItem from "./PrizeItem"
import type { Prize } from "@/types/campaign"
import styles from "../styles.module.scss"

const RulesTab = observer(() => {
  const { id } = useParams<{ id: string }>()
  const editorStore = useCampaignEditorStore()
  const campaignStore = useCampaignStore()
  const campaign = editorStore.editingCampaign

  if (!campaign) return null

  // 处理Publish状态变更（立即更新）
  const handlePublishChange = async (checked: boolean) => {
    if (!id) return

    editorStore.updateField("isActive", checked)

    try {
      const success = await campaignStore.updateCampaign(id, { isActive: checked })
      if (success) {
        // 更新编辑器的原始数据，避免标记为未保存
        editorStore.markSaved()
        showToast({ content: checked ? "Campaign published" : "Campaign unpublished" })
      }
    } catch (error) {
      console.error("Failed to update publish status:", error)
      showToast({ content: "Failed to update status", error: true })
      // 回滚
      editorStore.updateField("isActive", !checked)
    }
  }

  return (
    <div className={styles.content}>
      {/* Game Type */}
      <BlockStack gap="400">
        <div className={styles.section}>
          <Select
            label="Game Type"
            options={[
              { label: "9-Box", value: "ninebox" },
              { label: "Lucky Wheel", value: "wheel" },
              { label: "Slot Machine", value: "slot" },
              { label: "Scratch Card", value: "scratch" }
            ]}
            value={campaign.gameType}
            disabled={true}
            onChange={(value) => {
              editorStore.updateField("gameType", value as any)
            }}
            helpText="Game type cannot be changed after creation"
          />

          {/* Publish */}
          <div style={{ marginTop: "16px" }}>
            <Text as="h3" variant="headingSm">
              Publish
            </Text>
            <Checkbox
              label="Make this campaign live"
              checked={campaign.isActive}
              onChange={handlePublishChange}
              helpText="This will be saved immediately"
            />
          </div>
        </div>

        <Divider />

        {/* Campaign Basic Info */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Basic Information
          </Text>

          {/* Campaign Name */}
          <TextField
            label="Campaign Name"
            value={campaign.name}
            onChange={(value) => {
              editorStore.updateField("name", value)
            }}
            autoComplete="off"
            maxLength={50}
            helpText="Only visible to you, not shown to customers"
          />

          {/* Campaign Type */}
          <Select
            label="Campaign Type"
            options={[
              { label: "Order Lottery", value: "order" },
              { label: "Email Subscribe", value: "email_subscribe" }
            ]}
            value={campaign.type}
            onChange={(value) => {
              editorStore.updateField("type", value as any)
            }}
          />

          {/* Min Order Amount (只在 order 时显示) */}
          {campaign.type === "order" && (
            <TextField
              label="Min Order Amount"
              type="number"
              value={campaign.minOrderAmount?.toString() || ""}
              onChange={(value) => {
                editorStore.updateField("minOrderAmount", value ? parseFloat(value) : undefined)
              }}
              prefix="$"
              autoComplete="off"
              helpText="Minimum order amount required to play"
            />
          )}
        </div>

        <Divider />

        {/* Prize List */}
        <div className={styles.section}>
          <BlockStack gap="200">
            <div>
              <Text as="h3" variant="headingSm">
                Prizes (Max 9)
              </Text>
              <Text as="p" tone="subdued">
                Total Prizes: {campaign.prizes?.length || 0} / 9
              </Text>
            </div>

            <Button
              onClick={() => {
                const prizes = [...(campaign.prizes || [])]
                if (prizes.length >= 9) {
                  showToast({ content: "Maximum 9 prizes allowed", error: true })
                  return
                }

                const newPrize: Prize = {
                  name: "",
                  type: "no_prize",
                  chancePercentage: 0,
                  displayOrder: prizes.length
                }

                editorStore.updateField("prizes", [...prizes, newPrize])
                showToast({ content: "Prize added" })
              }}
              disabled={!campaign.prizes || campaign.prizes.length >= 9}
            >
              Add Prize
            </Button>

            {/* Prize List */}
            {campaign.prizes && campaign.prizes.length > 0 && (
              <BlockStack gap="200">
                {campaign.prizes.map((prize, index) => (
                  <PrizeItem
                    key={prize.id || `prize-${index}`}
                    prize={prize}
                    index={index}
                    onDelete={(deleteIndex) => {
                      const prizes = [...(campaign.prizes || [])]
                      prizes.splice(deleteIndex, 1)
                      editorStore.updateField("prizes", prizes)
                      showToast({ content: "Prize deleted" })
                    }}
                  />
                ))}
              </BlockStack>
            )}

            {/* Total Chance Warning */}
            {campaign.prizes && campaign.prizes.length > 0 && (() => {
              const totalChance = campaign.prizes.reduce(
                (sum, p) => sum + (p.chancePercentage || 0),
                0
              )
              if (totalChance !== 100) {
                return (
                  <div style={{
                    padding: "12px",
                    background: totalChance > 100
                      ? "var(--p-color-bg-surface-critical-subdued, #fef2f2)"
                      : "var(--p-color-bg-surface-warning-subdued, #fff4e5)",
                    border: `1px solid ${totalChance > 100
                      ? "var(--p-color-border-critical, #d72c0d)"
                      : "var(--p-color-border-warning, #f59e0b)"}`,
                    borderRadius: "8px"
                  }}>
                    <Text
                      as="p"
                      variant="bodySm"
                      tone={totalChance > 100 ? "critical" : "subdued"}
                    >
                      {totalChance > 100
                        ? `⚠️ Total chance exceeds 100% (${totalChance.toFixed(2)}%)`
                        : `ℹ️ Total chance is ${totalChance.toFixed(2)}% (should be 100%)`
                      }
                    </Text>
                  </div>
                )
              }
              return null
            })()}
          </BlockStack>
        </div>

        <Divider />

        {/* Schedule Rules */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Schedule Rules
          </Text>
          <Select
            label=""
            options={[
              { label: "Show for all time", value: "all_time" },
              { label: "Show between a time period", value: "time_period" }
            ]}
            value={campaign.scheduleType || "all_time"}
            onChange={(value) => {
              editorStore.updateField("scheduleType", value as any)
            }}
          />

          {campaign.scheduleType === "time_period" && (
            <BlockStack gap="200">
              <TextField
                label="Start Date"
                type="datetime-local"
                value={campaign.startAt?.slice(0, 16) || ""}
                onChange={(value) => {
                  editorStore.updateField("startAt", value ? new Date(value).toISOString() : undefined)
                }}
                autoComplete="off"
              />
              <TextField
                label="End Date"
                type="datetime-local"
                value={campaign.endAt?.slice(0, 16) || ""}
                onChange={(value) => {
                  editorStore.updateField("endAt", value ? new Date(value).toISOString() : undefined)
                }}
                autoComplete="off"
              />
            </BlockStack>
          )}
        </div>
      </BlockStack>
    </div>
  )
})

export default RulesTab

