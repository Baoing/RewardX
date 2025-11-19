import { observer } from "mobx-react-lite"
import {
  TextField,
  BlockStack,
  Text
} from "@shopify/polaris"
import { useCampaignEditorStore } from "@/stores"
import type { CampaignStyles } from "@/types/campaign"
import CustomCssEditor from "@/components/CustomCssEditor"
import styles from "../styles.module.scss"

const StylesTab = observer(() => {
  const editorStore = useCampaignEditorStore()
  const campaign = editorStore.editingCampaign

  if (!campaign) return null

  // 确保 styles 对象存在
  const campaignStyles: CampaignStyles = campaign.styles || {}

  const updateStyle = (field: keyof CampaignStyles, value: string | undefined) => {
    editorStore.updateField("styles", {
      ...campaignStyles,
      [field]: value
    })
  }

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
          <BlockStack gap="200">
            <TextField
              label="Text Color"
              value={campaignStyles.mainTextColor || ""}
              onChange={(value) => updateStyle("mainTextColor", value)}
              autoComplete="off"
              placeholder="#000000"
              prefix="#"
            />
            <TextField
              label="Background Color"
              value={campaignStyles.mainBackgroundColor || ""}
              onChange={(value) => updateStyle("mainBackgroundColor", value)}
              autoComplete="off"
              placeholder="#ffffff"
              prefix="#"
            />
          </BlockStack>
        </div>

        {/* TopBar Colors */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            TopBar Colors
          </Text>
          <BlockStack gap="200">
            <TextField
              label="Text Color"
              value={campaignStyles.topBarTextColor || ""}
              onChange={(value) => updateStyle("topBarTextColor", value)}
              autoComplete="off"
              placeholder="#000000"
              prefix="#"
            />
            <TextField
              label="Background Color"
              value={campaignStyles.topBarBackgroundColor || ""}
              onChange={(value) => updateStyle("topBarBackgroundColor", value)}
              autoComplete="off"
              placeholder="#ff841f"
              prefix="#"
            />
          </BlockStack>
        </div>

        {/* Module Colors */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Module Colors
          </Text>
          <BlockStack gap="200">
            <TextField
              label="Text Color"
              value={campaignStyles.moduleTextColor || ""}
              onChange={(value) => updateStyle("moduleTextColor", value)}
              autoComplete="off"
              placeholder="#000000"
              prefix="#"
            />
            <TextField
              label="Background Color"
              value={campaignStyles.moduleBackgroundColor || ""}
              onChange={(value) => updateStyle("moduleBackgroundColor", value)}
              autoComplete="off"
              placeholder="#ffcfa7"
              prefix="#"
            />
            <TextField
              label="Border Color"
              value={campaignStyles.moduleBorderColor || ""}
              onChange={(value) => updateStyle("moduleBorderColor", value)}
              autoComplete="off"
              placeholder="#ff841f"
              prefix="#"
            />
            <TextField
              label="Draw Background Color"
              value={campaignStyles.moduleDrawBackgroundColor || ""}
              onChange={(value) => updateStyle("moduleDrawBackgroundColor", value)}
              autoComplete="off"
              placeholder="#1a0202"
              prefix="#"
            />
            <TextField
              label="Button Color"
              value={campaignStyles.moduleButtonColor || ""}
              onChange={(value) => updateStyle("moduleButtonColor", value)}
              autoComplete="off"
              placeholder="#ff841f"
              prefix="#"
            />
          </BlockStack>
        </div>

        {/* Footer */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Footer
          </Text>
          <TextField
            label="Text Color"
            value={campaignStyles.footerTextColor || ""}
            onChange={(value) => updateStyle("footerTextColor", value)}
            autoComplete="off"
            placeholder="#666666"
            prefix="#"
          />
        </div>

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

