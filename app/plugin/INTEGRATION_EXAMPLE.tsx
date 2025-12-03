/**
 * 集成示例：如何在 Admin 活动详情页中使用插件组件
 */

// ============================================
// 示例 1: 在活动详情页的预览 Tab 中使用
// ============================================

// File: app/routes/_app.campaigns.$id/components/PreviewGame.tsx
import { observer } from "mobx-react-lite"
import { BlockStack, Card, Text } from "@shopify/polaris"
import { NineBoxLottery } from "@plugin/main"
import { campaignEditorStore } from "@/stores/campaignEditorStore"

export const PreviewGame = observer(() => {
  const campaign = campaignEditorStore.editingCampaign

  if (!campaign) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="p">加载中...</Text>
        </BlockStack>
      </Card>
    )
  }

  const handlePrizeWon = (prize: any) => {
    console.log("🎉 中奖:", prize)
    // 在这里可以显示中奖弹窗或提示
  }

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          实时预览
        </Text>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            background: campaign.styles.mainBackgroundColor || "#f5f5f5",
            borderRadius: "8px",
            padding: "40px"
          }}
        >
          <NineBoxLottery
            prizes={campaign.prizes}
            campaignStyles={campaign.styles}
            disabled={!campaign.isActive}
            onComplete={handlePrizeWon}
          />
        </div>

        {!campaign.isActive && (
          <Text as="p" tone="subdued" alignment="center">
            活动已禁用 - 预览模式
          </Text>
        )}
      </BlockStack>
    </Card>
  )
})

// ============================================
// 示例 2: 在主 route 中添加 PreviewGame
// ============================================

// File: app/routes/_app.campaigns.$id/route.tsx
import { observer } from "mobx-react-lite"
import { Tabs } from "@shopify/polaris"
import { useState } from "react"
import { RulesTab } from "./components/RulesTab"
import { ContentTab } from "./components/ContentTab"
import { StylesTab } from "./components/StylesTab"
import { PreviewGame } from "./components/PreviewGame" // 新增

export default observer(function CampaignDetailPage() {
  const [selectedTab, setSelectedTab] = useState(0)

  const tabs = [
    {
      id: "rules",
      content: "规则配置",
      component: <RulesTab />
    },
    {
      id: "content",
      content: "内容设置",
      component: <ContentTab />
    },
    {
      id: "styles",
      content: "样式定制",
      component: <StylesTab />
    },
  ]

  return (
    <div>
      <Tabs
        tabs={tabs.map((tab, index) => ({
          id: tab.id,
          content: tab.content
        }))}
        selected={selectedTab}
        onSelect={setSelectedTab}
        fitted
      />

      <div style={{ marginTop: "20px" }}>
        {tabs[selectedTab].component}
      </div>
    </div>
  )
})

// ============================================
// 示例 3: 使用 useEffect 实现动态渲染
// ============================================

// 如果需要更灵活的控制，可以使用 renderLotteryPreview 函数
import { useRef, useEffect } from "react"
import { renderLotteryPreview } from "@plugin/main"

export const DynamicPreview = observer(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const campaign = campaignEditorStore.editingCampaign

  useEffect(() => {
    if (!containerRef.current || !campaign) return

    // 使用渲染函数
    const cleanup = renderLotteryPreview(containerRef.current, campaign)

    // 清理函数
    return cleanup
  }, [campaign])

  return <div ref={containerRef} style={{ minHeight: "400px" }} />
})

// ============================================
// 示例 4: 在 Storefront 中嵌入（Liquid）
// ============================================

/*
{% comment %}
  File: extensions/lottery-game/blocks/lottery-block.liquid
{% endcomment %}

{{ 'lottery-game.js' | asset_url | script_tag }}

<div
  class="rewardx-lottery-wrapper"
  style="padding: 40px; max-width: 600px; margin: 0 auto;"
>
  <div
    data-rewardx-lottery
    data-campaign-id="{{ block.settings.campaign_id }}"
  ></div>
</div>

<style>
  .rewardx-lottery-wrapper {
    background: #f5f5f5;
    border-radius: 12px;
  }
</style>

{% schema %}
{
  "name": "RewardX Lottery Game",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "campaign_id",
      "label": "活动 ID",
      "info": "从 RewardX Admin 获取活动 ID"
    },
    {
      "type": "checkbox",
      "id": "show_on_mobile",
      "label": "在移动端显示",
      "default": true
    }
  ],
  "presets": [
    {
      "name": "抽奖游戏",
      "category": "RewardX"
    }
  ]
}
{% endschema %}
*/

// ============================================
// 示例 5: 在产品页面添加抽奖按钮（Liquid）
// ============================================

/*
{% comment %}
  File: sections/product-template.liquid
  在产品详情页添加抽奖入口
{% endcomment %}

{% if product.metafields.rewardx.campaign_id %}
  <div class="product-lottery-section">
    <button
      class="btn btn-primary lottery-trigger"
      onclick="openRewardXLottery('{{ product.metafields.rewardx.campaign_id }}')"
    >
      🎁 参与抽奖赢折扣
    </button>
  </div>

  <div id="rewardx-lottery-modal" style="display: none;"></div>

  {{ 'lottery-game.js' | asset_url | script_tag }}

  <script>
    function openRewardXLottery(campaignId) {
      const modal = document.getElementById('rewardx-lottery-modal')
      modal.style.display = 'block'
      modal.setAttribute('data-rewardx-lottery', '')
      modal.setAttribute('data-campaign-id', campaignId)

      // 重新初始化
      if (window.RewardX) {
        window.RewardX.init()
      }
    }
  </script>

  <style>
    .product-lottery-section {
      margin: 20px 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      text-align: center;
    }

    .lottery-trigger {
      background: white;
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
      padding: 12px 32px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .lottery-trigger:hover {
      transform: translateY(-2px);
    }

    #rewardx-lottery-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.5);
    }
  </style>
{% endif %}
*/

// ============================================
// 完整的 TypeScript 类型定义
// ============================================

// 确保与 app/plugin/main.tsx 中的类型定义一致
export interface Prize {
  id: string
  type: "discount_percentage" | "discount_fixed" | "free_gift" | "no_prize"
  label: string
  value?: number
  giftProductId?: string
  giftVariantId?: string
  totalStock: number
  usedStock: number
  chancePercentage: number
  image?: string
}

export interface CampaignStyles {
  titleColor?: string
  mainTextColor?: string
  mainBackgroundColor?: string
  moduleContainerBackgroundColor?: string
  moduleBorderColor?: string
  moduleDotsColor?: string
  moduleMainBackgroundColor?: string
  moduleCardBackgroundColor?: string
  moduleButtonColor?: string
  buttonColor?: string
  footerTextColor?: string
  customCSS?: string
}

export interface Campaign {
  id: string
  name: string
  type: "order" | "email_subscribe"
  gameType: "nine_box" | "lucky_wheel" | "slot_machine" | "scratch_card"
  isActive: boolean
  minOrderAmount?: number
  prizes: Prize[]
  content: {
    title: string
    description?: string
    inputTitle?: string
    inputPlaceholder?: string
    inputErrorMessage?: string
    buttonText?: string
    rulesText1?: string
    rulesText2?: string
  }
  styles: CampaignStyles
  startDate?: string
  endDate?: string
}

