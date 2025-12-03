import { observer } from "mobx-react-lite"
import { useState, useCallback } from "react"
import {
  BlockStack,
  Text,
  Divider
} from "@shopify/polaris"
import { useCampaignEditorStore } from "@/stores"
import type { CampaignStyles } from "@/types/campaign"
import CustomCssEditor from "@/components/CustomCssEditor"
import { ColorPicker } from "@/components/ColorPicker"
import styles from "../styles.module.scss"

const StylesTab = observer(() => {
  const editorStore = useCampaignEditorStore()
  const campaign = editorStore.editingCampaign

  // 统一管理 Popover 打开状态，同一时间只能打开一个
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null)

  if (!campaign) return null

  // 确保 styles 对象存在
  const campaignStyles: CampaignStyles = campaign.styles || {}

  const updateStyle = (field: keyof CampaignStyles, value: string | undefined) => {
    editorStore.updateField("styles", {
      ...campaignStyles,
      [field]: value
    })
  }

  // 处理 ColorPicker Popover 状态变化
  const handleColorPickerActiveChange = useCallback((active: boolean, id?: string) => {
    if (active && id) {
      // 打开指定的 ColorPicker，关闭其他的
      setActiveColorPickerId(id)
    } else {
      // 关闭所有
      setActiveColorPickerId(null)
    }
  }, [])

  return (
    <div className={styles.content}>
      <BlockStack gap="400">
        {/* Main Colors */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Main Colors
          </Text>
          <Text as="p" tone="subdued" variant="bodySm">
            Leave empty to inherit from theme
          </Text>
          <div className={styles.colorGroup}>
            <ColorPicker
              id="titleColor"
              label="Title Color"
              color={campaignStyles.titleColor}
              onChange={(value) => updateStyle("titleColor", value)}
              placeholder="Inherit from theme"
              allowEmpty={true}
              active={activeColorPickerId === "titleColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
            <ColorPicker
              id="mainTextColor"
              label="Text Color"
              color={campaignStyles.mainTextColor}
              onChange={(value) => updateStyle("mainTextColor", value)}
              placeholder="Inherit from theme"
              allowEmpty={true}
              active={activeColorPickerId === "mainTextColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
            <ColorPicker
              id="mainBackgroundColor"
              label="Background Color"
              color={campaignStyles.mainBackgroundColor}
              onChange={(value) => updateStyle("mainBackgroundColor", value)}
              placeholder="Inherit from theme"
              allowEmpty={true}
              active={activeColorPickerId === "mainBackgroundColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
          </div>
        </div>

        <Divider />

        {/* Module Colors */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Module Colors
          </Text>
          <div className={styles.colorGroup}>
            <ColorPicker
              id="moduleContainerBackgroundColor"
              label="Container Background"
              color={campaignStyles.moduleContainerBackgroundColor}
              onChange={(value) => updateStyle("moduleContainerBackgroundColor", value)}
              placeholder="#FFCFA7"
              allowEmpty={true}
              active={activeColorPickerId === "moduleContainerBackgroundColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
            <ColorPicker
              id="moduleBorderColor"
              label="Border Color"
              color={campaignStyles.moduleBorderColor}
              onChange={(value) => updateStyle("moduleBorderColor", value)}
              placeholder="#FF841F"
              allowEmpty={true}
              active={activeColorPickerId === "moduleBorderColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
            <ColorPicker
              id="moduleDotsColor"
              label="Dots Color"
              color={campaignStyles.moduleDotsColor}
              onChange={(value) => updateStyle("moduleDotsColor", value)}
              placeholder="#FFCFA7"
              allowEmpty={true}
              active={activeColorPickerId === "moduleDotsColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
            <ColorPicker
              id="moduleMainBackgroundColor"
              label="Main Background"
              color={campaignStyles.moduleMainBackgroundColor}
              onChange={(value) => updateStyle("moduleMainBackgroundColor", value)}
              placeholder="#1A0202"
              allowEmpty={true}
              active={activeColorPickerId === "moduleMainBackgroundColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
            <ColorPicker
              id="moduleCardBackgroundColor"
              label="Card Background"
              color={campaignStyles.moduleCardBackgroundColor}
              onChange={(value) => updateStyle("moduleCardBackgroundColor", value)}
              placeholder="Inherit from theme"
              allowEmpty={true}
              active={activeColorPickerId === "moduleCardBackgroundColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
            <ColorPicker
              id="moduleButtonColor"
              label="Button Color"
              color={campaignStyles.moduleButtonColor}
              onChange={(value) => updateStyle("moduleButtonColor", value)}
              placeholder="Inherit from theme"
              allowEmpty={true}
              active={activeColorPickerId === "moduleButtonColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
          </div>
        </div>

        <Divider />

        {/* Footer */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Footer
          </Text>
          <div className={styles.colorGroup}>
            <ColorPicker
              id="footerTextColor"
              label="Text Color"
              color={campaignStyles.footerTextColor}
              onChange={(value) => updateStyle("footerTextColor", value)}
              placeholder="#666666"
              allowEmpty={true}
              active={activeColorPickerId === "footerTextColor"}
              onActiveChange={handleColorPickerActiveChange}
            />
          </div>
        </div>

        <Divider />

        {/* Custom CSS */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Custom CSS
          </Text>
          <Text as="p" tone="subdued" variant="bodySm">
            Add CSS codes here to do some custom change, this won't influence your store theme.
          </Text>
          <div style={{ marginTop: "8px" }}>
            <CustomCssEditor
              value={campaignStyles.customCSS || ""}
              onChange={(value) => updateStyle("customCSS", value)}
              height="300px"
            />
          </div>
        </div>
      </BlockStack>
    </div>
  )
})

export default StylesTab

