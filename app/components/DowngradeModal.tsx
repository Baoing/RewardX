import { Modal, Text, BlockStack, InlineStack, Button } from "@shopify/polaris"
import { useTranslation } from "react-i18next"

type DowngradeModalProps = {
  open: boolean
  currentPlan: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

/**
 * 降级确认弹窗
 * 
 * 用户从付费套餐降级到免费套餐时的确认对话框
 */
export function DowngradeModal({
  open,
  currentPlan,
  onConfirm,
  onCancel,
  loading = false
}: DowngradeModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t("billing.downgradeModal.title")}
      primaryAction={{
        content: t("billing.downgradeModal.confirm"),
        destructive: true,
        onAction: onConfirm,
        loading
      }}
      secondaryActions={[
        {
          content: t("billing.downgradeModal.cancel"),
          onAction: onCancel,
          disabled: loading
        }
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            {t("billing.downgradeModal.message", { plan: currentPlan })}
          </Text>

          <BlockStack gap="200">
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {t("billing.downgradeModal.consequences")}
            </Text>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                • {t("billing.downgradeModal.consequence1")}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                • {t("billing.downgradeModal.consequence2")}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                • {t("billing.downgradeModal.consequence3")}
              </Text>
            </BlockStack>
          </BlockStack>

          <Text as="p" variant="bodySm" tone="critical">
            {t("billing.downgradeModal.warning")}
          </Text>
        </BlockStack>
      </Modal.Section>
    </Modal>
  )
}


