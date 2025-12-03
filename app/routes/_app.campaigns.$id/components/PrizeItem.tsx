import { observer } from "mobx-react-lite"
import {
  Badge,
  Button,
  Collapsible,
  TextField,
  Select,
  Text,
  BlockStack,
  InlineStack,
  Thumbnail,
  Link
} from "@shopify/polaris"
import { useCallback, useState, useRef } from "react"
import { useCampaignEditorStore } from "@/stores"
import type { Prize } from "@/types/campaign"
import { showSuccessToast, showErrorToast } from "@/utils/toast"
import styles from "../styles.module.scss"

interface PrizeItemProps {
  prize: Prize
  index: number
  onDelete?: (index: number) => void
}

const PrizeItem = observer(({ prize, index, onDelete }: PrizeItemProps) => {
  const editorStore = useCampaignEditorStore()
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleToggle = useCallback(() => setOpen((open) => !open), [])

  const prizeTypes = [
    { label: "No Prize", value: "no_prize" },
    { label: "Discount Percentage", value: "discount_percentage" },
    { label: "Discount Fixed Amount", value: "discount_fixed" },
    { label: "Free Shipping", value: "free_shipping" },
    { label: "Free Gift", value: "free_gift" }
  ]

  const updatePrizeField = (field: keyof Prize, value: any) => {
    const prizes = [...(editorStore.editingCampaign?.prizes || [])]
    prizes[index] = {
      ...prizes[index],
      [field]: value
    }
    editorStore.updateField("prizes", prizes)
  }

  const handleNameChange = (value: string) => {
    updatePrizeField("name", value)
  }

  const handleTypeChange = (value: string) => {
    updatePrizeField("type", value as Prize["type"])
    // 当类型改变时，清除相关字段
    if (value !== "discount_percentage" && value !== "discount_fixed") {
      updatePrizeField("discountValue", undefined)
    }
    if (value !== "free_gift") {
      updatePrizeField("giftProductId", undefined)
      updatePrizeField("giftVariantId", undefined)
    }
  }

  const handleChanceChange = (value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updatePrizeField("chancePercentage", numValue)
    }
  }

  const handleDiscountValueChange = (value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value)
    if (!isNaN(numValue || 0)) {
      updatePrizeField("discountValue", numValue)
    }
  }

  const handleTotalStockChange = (value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10)
    if (!isNaN(numValue || 0) && (numValue === null || numValue > 0)) {
      updatePrizeField("totalStock", numValue)
    }
  }

  const handleImageUrlChange = (value: string) => {
    updatePrizeField("image", value || undefined)
  }

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      showErrorToast("Please select an image file")
      return
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      showErrorToast("File size must be less than 10MB")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed")
      }

      if (data.url) {
        // 直接使用返回的URL
        updatePrizeField("image", data.url)
        showSuccessToast("Image uploaded successfully")
      } else if (data.fileId) {
        // 如果文件还在处理中，提示用户
        showErrorToast(data.message || "File is being processed. Please try again in a moment.")
      } else {
        throw new Error("No URL returned from server")
      }
    } catch (error) {
      console.error("❌ 图片上传失败:", error)
      showErrorToast(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setUploading(false)
      // 重置input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [updatePrizeField])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleDelete = () => {
    if (onDelete) {
      onDelete(index)
    }
  }

  // 计算总概率（用于验证）
  const totalChance = (editorStore.editingCampaign?.prizes || []).reduce(
    (sum, p) => sum + (p.chancePercentage || 0),
    0
  )

  const chanceError = prize.chancePercentage < 0 || prize.chancePercentage > 100
    ? "Chance must be between 0 and 100"
    : totalChance > 100
    ? "Total chance of all prizes exceeds 100%"
    : ""

  const nameError = !prize.name || prize.name.trim() === ""
    ? "This field can't be blank"
    : ""

  const discountValueError = 
    (prize.type === "discount_percentage" || prize.type === "discount_fixed") &&
    (!prize.discountValue || prize.discountValue < 0)
    ? prize.type === "discount_percentage" && prize.discountValue !== undefined && prize.discountValue > 100
      ? "Discount percentage must be between 0 and 100"
      : "This field can't be blank"
    : ""

  const hasError = chanceError || nameError || discountValueError

  return (
    <div
      className={`${styles.prizeItem} ${!open && hasError ? styles.prizeItemError : ""}`}
      style={index === (editorStore.editingCampaign?.prizes?.length || 0) - 1 ? { marginBottom: 0 } : {}}
    >
      <div className={styles.prizeItemBar}>
        {open ? (
          <div className={styles.prizeItemTitle}>
            Prize {index + 1}
          </div>
        ) : (
          <div className={styles.prizeItemFlexBar}>
            <InlineStack gap="200" align="start">
              {prize.image && (
                <Thumbnail
                  source={prize.image}
                  alt={prize.name || "Prize image"}
                  size="small"
                />
              )}
              <div>
                <div className={styles.prizeItemLabel}>
                  {prize.name || "Untitled Prize"}
                </div>
                <InlineStack gap="100">
                  <Badge>{`${prize.chancePercentage}% chance`}</Badge>
                  {prize.type !== "no_prize" && (
                    <Badge tone="info">{prize.type}</Badge>
                  )}
                </InlineStack>
              </div>
            </InlineStack>
          </div>
        )}

        <InlineStack gap="200">
          {onDelete && (
            <Button
              variant="plain"
              tone="critical"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
          <Button onClick={handleToggle} variant="plain">
            {open ? "Close" : "Edit"}
          </Button>
        </InlineStack>
      </div>

      <Collapsible
        open={open}
        id={`prize-collapsible-${index}`}
        transition={{ duration: "500ms", timingFunction: "ease-in-out" }}
        expandOnPrint
      >
        <div className={styles.prizeItemContent}>
          <BlockStack gap="300">
            {/* Name */}
            <TextField
              label="Prize Name"
              value={prize.name || ""}
              onChange={handleNameChange}
              error={nameError}
              maxLength={50}
              autoComplete="off"
              showCharacterCount
              helpText="The name displayed to customers"
            />

            {/* Image URL */}
            <BlockStack gap="200">
              <TextField
                label="Prize Image"
                value={prize.image || ""}
                onChange={handleImageUrlChange}
                placeholder="Enter image URL or upload image"
                autoComplete="off"
                helpText="Enter a full image URL or upload an image file"
              />
              <InlineStack gap="200">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <Button
                  onClick={handleUploadClick}
                  loading={uploading}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
              </InlineStack>
              {prize.image && (
                <div>
                  <Thumbnail
                    source={prize.image}
                    alt={prize.name || "Prize preview"}
                    size="medium"
                  />
                  <Text as="p" variant="bodySm" tone="subdued">
                    Image preview
                  </Text>
                </div>
              )}
              <Text as="p" variant="bodySm" tone="subdued">
                <Link
                  url="https://help.shopify.com/en/manual/products/product-media"
                  external
                >
                  Learn more about image requirements
                </Link>
              </Text>
            </BlockStack>

            {/* Type */}
            <Select
              label="Prize Type"
              options={prizeTypes}
              value={prize.type}
              onChange={handleTypeChange}
              helpText="Select the type of reward for this prize"
            />

            {/* Discount Value (for discount types) */}
            {(prize.type === "discount_percentage" || prize.type === "discount_fixed") && (
              <TextField
                label="Discount Value"
                type="number"
                value={prize.discountValue?.toString() || ""}
                onChange={handleDiscountValueChange}
                error={discountValueError}
                suffix={prize.type === "discount_percentage" ? "%" : "$"}
                autoComplete="off"
                helpText={
                  prize.type === "discount_percentage"
                    ? "Enter a percentage between 0 and 100"
                    : "Enter the fixed discount amount"
                }
              />
            )}

            {/* Gift Product (for free_gift type) */}
            {prize.type === "free_gift" && (
              <BlockStack gap="200">
                <TextField
                  label="Gift Product ID"
                  value={prize.giftProductId || ""}
                  onChange={(value) => updatePrizeField("giftProductId", value || undefined)}
                  placeholder="Enter Shopify product ID"
                  autoComplete="off"
                  helpText="The Shopify product ID for the free gift"
                />
                <TextField
                  label="Gift Variant ID"
                  value={prize.giftVariantId || ""}
                  onChange={(value) => updatePrizeField("giftVariantId", value || undefined)}
                  placeholder="Enter Shopify variant ID (optional)"
                  autoComplete="off"
                  helpText="The specific variant ID if applicable"
                />
              </BlockStack>
            )}

            {/* Chance Percentage */}
            <TextField
              label="Win Chance"
              type="number"
              suffix="%"
              value={prize.chancePercentage?.toString() || "0"}
              onChange={handleChanceChange}
              error={chanceError}
              autoComplete="off"
              helpText="The probability of winning this prize (0-100%)"
            />

            {/* Stock Management */}
            <BlockStack gap="200">
              <TextField
                label="Total Stock (Optional)"
                type="number"
                value={prize.totalStock?.toString() || ""}
                onChange={handleTotalStockChange}
                placeholder="Leave empty for unlimited"
                autoComplete="off"
                helpText="Maximum number of times this prize can be won. Leave empty for unlimited stock."
              />
              {prize.totalStock && (
                <Text as="p" variant="bodySm" tone="subdued">
                  Used: {prize.usedStock || 0} / {prize.totalStock}
                </Text>
              )}
            </BlockStack>
          </BlockStack>
        </div>
      </Collapsible>
    </div>
  )
})

export default PrizeItem


