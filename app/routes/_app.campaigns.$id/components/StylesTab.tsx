import { observer } from "mobx-react-lite"
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
          <div className={styles.colorGroup}>
            <ColorPicker
              label="Text Color"
              color={campaignStyles.mainTextColor}
              onChange={(value) => updateStyle("mainTextColor", value)}
              placeholder="Inherit from theme"
              allowEmpty={true}
            />
            <ColorPicker
              label="Background Color"
              color={campaignStyles.mainBackgroundColor}
              onChange={(value) => updateStyle("mainBackgroundColor", value)}
              placeholder="Inherit from theme"
              allowEmpty={true}
            />
          </div>
        </div>

        <Divider />

        {/* TopBar Colors */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            TopBar Colors
          </Text>
          <div className={styles.colorGroup}>
            <ColorPicker
              label="Text Color"
              color={campaignStyles.topBarTextColor}
              onChange={(value) => updateStyle("topBarTextColor", value)}
              placeholder="#000000"
              allowEmpty={true}
            />
            <ColorPicker
              label="Background Color"
              color={campaignStyles.topBarBackgroundColor}
              onChange={(value) => updateStyle("topBarBackgroundColor", value)}
              placeholder="#ff841f"
              allowEmpty={true}
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
              label="Text Color"
              color={campaignStyles.moduleTextColor}
              onChange={(value) => updateStyle("moduleTextColor", value)}
              placeholder="#000000"
              allowEmpty={true}
            />
            <ColorPicker
              label="Background Color"
              color={campaignStyles.moduleBackgroundColor}
              onChange={(value) => updateStyle("moduleBackgroundColor", value)}
              placeholder="#ffcfa7"
              allowEmpty={true}
            />
            <ColorPicker
              label="Border Color"
              color={campaignStyles.moduleBorderColor}
              onChange={(value) => updateStyle("moduleBorderColor", value)}
              placeholder="#ff841f"
              allowEmpty={true}
            />
            <ColorPicker
              label="Draw Background Color"
              color={campaignStyles.moduleDrawBackgroundColor}
              onChange={(value) => updateStyle("moduleDrawBackgroundColor", value)}
              placeholder="#1a0202"
              allowEmpty={true}
            />
            <ColorPicker
              label="Button Color"
              color={campaignStyles.moduleButtonColor}
              onChange={(value) => updateStyle("moduleButtonColor", value)}
              placeholder="#ff841f"
              allowEmpty={true}
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
              label="Text Color"
              color={campaignStyles.footerTextColor}
              onChange={(value) => updateStyle("footerTextColor", value)}
              placeholder="#666666"
              allowEmpty={true}
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

