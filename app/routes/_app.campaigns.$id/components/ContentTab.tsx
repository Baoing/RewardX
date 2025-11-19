import { observer } from "mobx-react-lite"
import {
  TextField,
  BlockStack,
  Text,
  Divider
} from "@shopify/polaris"
import { useCampaignEditorStore } from "@/stores"
import type { CampaignContent } from "@/types/campaign"
import styles from "../styles.module.scss"

const ContentTab = observer(() => {
  const editorStore = useCampaignEditorStore()
  const campaign = editorStore.editingCampaign

  if (!campaign) return null

  // 确保 content 对象存在
  const content: CampaignContent = campaign.content || {}

  const updateContent = (field: keyof CampaignContent, value: string | undefined) => {
    editorStore.updateField("content", {
      ...content,
      [field]: value
    })
  }

  return (
    <div className={styles.content}>
      <BlockStack gap="400">
        {/* Header Content */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Header Content
          </Text>

          {/* Title */}
          <TextField
            label="Title"
            value={content.title || ""}
            onChange={(value) => updateContent("title", value)}
            autoComplete="off"
            maxLength={100}
            helpText="Main title displayed at the top of the game"
          />

          {/* Description */}
          <TextField
            label="Description"
            value={content.description || ""}
            onChange={(value) => updateContent("description", value)}
            autoComplete="off"
            multiline={3}
            maxLength={500}
            helpText="Short description or instructions"
          />
        </div>

        <Divider />

        {/* Input Field Settings */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Input Field Settings
          </Text>

          {/* Input Title */}
          <TextField
            label="Input Title"
            value={content.inputTitle || ""}
            onChange={(value) => updateContent("inputTitle", value)}
            autoComplete="off"
            placeholder="E.g., Please enter your order number (e.g., #HTVRONT1234567)"
            helpText="Label above the input field"
          />

          {/* Input Placeholder */}
          <TextField
            label="Input Placeholder"
            value={content.inputPlaceholder || ""}
            onChange={(value) => updateContent("inputPlaceholder", value)}
            autoComplete="off"
            placeholder="Please enter your order number"
            helpText="Placeholder text inside the input field"
          />

          {/* Input Empty Error */}
          <TextField
            label="Input Empty Error"
            value={content.inputEmptyError || ""}
            onChange={(value) => updateContent("inputEmptyError", value)}
            autoComplete="off"
            placeholder="Order number is required"
            helpText="Error message when input is empty"
          />

          {/* Generic Error Message */}
          <TextField
            label="Error Message"
            value={content.errorMessage || ""}
            onChange={(value) => updateContent("errorMessage", value)}
            autoComplete="off"
            placeholder="Something went wrong. Please try again."
            helpText="Generic error message for unexpected errors"
          />
        </div>

        <Divider />

        {/* Button */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Button
          </Text>

          {/* Button Text */}
          <TextField
            label="Button Text"
            value={content.buttonText || ""}
            onChange={(value) => updateContent("buttonText", value)}
            autoComplete="off"
            placeholder="Play Now"
            maxLength={30}
            helpText="Text displayed on the play button"
          />
        </div>

        <Divider />

        {/* Rules */}
        <div className={styles.section}>
          <Text as="h3" variant="headingSm">
            Rules & Terms
          </Text>

          {/* Rules Text 1 */}
          <TextField
            label="Rules Section 1"
            value={content.rulesText1 || ""}
            onChange={(value) => updateContent("rulesText1", value)}
            autoComplete="off"
            multiline={6}
            helpText="First rules section"
          />

          {/* Rules Text 2 */}
          <TextField
            label="Rules Section 2"
            value={content.rulesText2 || ""}
            onChange={(value) => updateContent("rulesText2", value)}
            autoComplete="off"
            multiline={6}
            helpText="Second rules section"
          />
        </div>
      </BlockStack>
    </div>
  )
})

export default ContentTab

