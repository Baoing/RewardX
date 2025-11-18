import { useState, useCallback } from "react"
import { useNavigate, Link } from "react-router"
import {
  Button,
  Text,
  Tooltip,
  Badge,
  InlineStack,
  BlockStack,
  Popover,
  ActionList
} from "@shopify/polaris"
import { MenuHorizontalIcon } from "@shopify/polaris-icons"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/EnhancePolaris"
import { Switch } from "@/components/Switch"
import type { Campaign } from "@/types/campaign"
import styles from "./CampaignItem.module.scss"

export interface CampaignItemProps {
  campaign: Campaign
  onToggleStatus?: (id: string, isActive: boolean) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export default function CampaignItem({
  campaign,
  onToggleStatus,
  onDelete
}: CampaignItemProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isToggling, setIsToggling] = useState(false)

  const trueVal = (val: number, suffix: string = ""): string => {
    if (val === 0) {
      return "-"
    }
    return `${val}${suffix}`
  }

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "-"
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  // ✅ 简化：只根据 isActive 显示状态
  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? <Badge tone="success">Active</Badge>
      : <Badge tone="warning">Inactive</Badge>
  }

  const getGameTypeLabel = (gameType: string) => {
    const types: Record<string, string> = {
      "ninebox": "🎲 Nine Box",
      "wheel": "🎡 Lucky Wheel",
      "slot": "🎰 Slot Machine"
    }
    return types[gameType] || gameType
  }

  const handleToggleStatus = async () => {
    if (!onToggleStatus) return

    setIsToggling(true)
    try {
      await onToggleStatus(campaign.id, !campaign.isActive)
    } finally {
      setIsToggling(false)
    }
  }

  const winRate = campaign.totalPlays > 0
    ? ((campaign.totalWins / campaign.totalPlays) * 100).toFixed(1)
    : "0"

  return (
    <div className={styles.campaignItem}>
      <div className={styles.campaignItem__info}>
        {/* 游戏类型图标 */}
        <div className={styles.campaignItem__icon}>
          <div className={styles.iconWrapper}>
            <Text variant="heading2xl" as="span">
              {campaign.gameType === "ninebox" && "🎲"}
              {campaign.gameType === "wheel" && "🎡"}
              {campaign.gameType === "slot" && "🎰"}
            </Text>
          </div>
        </div>

         <div className={"flex justify-between flex-1 items-center"}>
           {/* 活动信息 */}
           <div className={styles.campaignItem__metadata}>
             <InlineStack gap="200" blockAlign="center">
               <Text variant="bodyLg" as="h2" fontWeight="medium">
                 {campaign.name}
               </Text>
             </InlineStack>

             <div className="mt-1">
               <BlockStack gap="100">
                 {/*<Text variant="bodySm" as="p" tone="subdued">*/}
                 {/*  {getGameTypeLabel(campaign.gameType)} • {campaign.type === "order" ? "Order Required" : "Free"}*/}
                 {/*</Text>*/}
                 <Text variant="bodySm" as="p" tone="subdued">
                   Created: {formatDate(campaign.createdAt)}
                 </Text>
                 <Text variant="bodySm" as="p" tone="subdued">
                   Last updated: {formatDate(campaign.updatedAt)}
                 </Text>
               </BlockStack>
             </div>
           </div>

           {/* 操作区 */}
           <div className={"flex gap-3 items-center"}>
             {/* Switch 替换 Badge 和按钮 */}

               <div className="flex items-center gap-2">
                 {getStatusBadge(campaign.isActive)}
                 <Tooltip content={campaign.isActive ? "Active - Click to deactivate" : "Inactive - Click to activate"}>
                   <Switch
                     checked={campaign.isActive}
                     disabled={isToggling}
                     onChange={() => handleToggleStatus()}
                   />
                 </Tooltip>
               </div>

            <Button
              variant="primary"
              size="slim"
              onClick={() => navigate(`/campaigns/${campaign.id}`)}
            >
              Customize
            </Button>

             <MoreActions
               campaignId={campaign.id}
               campaignName={campaign.name}
               onDelete={onDelete}
             />
           </div>
         </div>
      </div>

      {/* 统计数据 - 移动端 */}
      <div className={`${styles.campaignItem__statisticsMobile} lg:hidden`}>
        <div className={styles.statItem}>
          <Text variant="bodySm" as="span" tone="subdued">Plays</Text>
          <Text variant="bodyMd" as="span" fontWeight="semibold">{trueVal(campaign.totalPlays)}</Text>
        </div>
        <div className={styles.statItem}>
          <Text variant="bodySm" as="span" tone="subdued">Wins</Text>
          <Text variant="bodyMd" as="span" fontWeight="semibold">{trueVal(campaign.totalWins)}</Text>
        </div>
        <div className={styles.statItem}>
          <Text variant="bodySm" as="span" tone="subdued">Orders</Text>
          <Text variant="bodyMd" as="span" fontWeight="semibold">{trueVal(campaign.totalOrders)}</Text>
        </div>
        <div className={styles.statItem}>
          <Text variant="bodySm" as="span" tone="subdued">Win Rate</Text>
          <Text variant="bodyMd" as="span" fontWeight="semibold">{winRate}%</Text>
        </div>
      </div>

      {/* 统计数据 - PC端 */}
      <div className={`${styles.campaignItem__statistics} hidden lg:flex`}>
        <div className={styles.statisticItem}>
          <Text variant="bodySm" as="span" tone="subdued">Total Plays</Text>
          <Text variant="bodyMd" as="span" fontWeight="semibold">{trueVal(campaign.totalPlays)}</Text>
        </div>

        <div className={styles.statisticItem}>
          <Text variant="bodySm" as="span" tone="subdued">Total Wins</Text>
          <Text variant="bodyMd" as="span" fontWeight="semibold">{trueVal(campaign.totalWins)}</Text>
        </div>

        <div className={styles.statisticItem}>
          <Text variant="bodySm" as="span" tone="subdued">Orders</Text>
          <Text variant="bodyMd" as="span" fontWeight="semibold">{trueVal(campaign.totalOrders)}</Text>
        </div>

        <div className={styles.statisticItem}>
          <Text variant="bodySm" as="span" tone="subdued">Win Rate</Text>
          <Text variant="bodyMd" as="span" fontWeight="semibold">{winRate}%</Text>
        </div>
      </div>
    </div>
  )
}

interface MoreActionsProps {
  campaignId: string
  campaignName: string
  onDelete?: (id: string) => Promise<void>
}

function MoreActions({ campaignId, campaignName, onDelete }: MoreActionsProps) {
  const navigate = useNavigate()
  const [popoverActive, setPopoverActive] = useState(false)

  const togglePopoverActive = useCallback(
    () => setPopoverActive((active) => !active),
    []
  )

  const handleDelete = async () => {
    if (!onDelete) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${campaignName}"? This action cannot be undone.`
    )

    if (confirmed) {
      await onDelete(campaignId)
    }
  }

  return (
    <Popover
      active={popoverActive}
      activator={
        <Button
          variant="tertiary"
          size="slim"
          onClick={togglePopoverActive}
          icon={MenuHorizontalIcon}
        />
      }
      autofocusTarget="first-node"
      onClose={togglePopoverActive}
    >
      <ActionList
        actionRole="menuitem"
        onActionAnyItem={togglePopoverActive}
        items={[
          // {
          //   content: "View Analytics",
          //   onAction: () => navigate(`/campaigns/${campaignId}/analytics`)
          // },
          // {
          //   content: "View Entries",
          //   onAction: () => navigate(`/campaigns/${campaignId}/entries`)
          // },
          // {
          //   content: "Duplicate",
          //   onAction: () => {
          //     // TODO: 实现复制功能
          //     console.log("Duplicate campaign:", campaignId)
          //   }
          // },
          {
            destructive: true,
            content: "Delete",
            onAction: handleDelete
          }
        ]}
      />
    </Popover>
  )
}

