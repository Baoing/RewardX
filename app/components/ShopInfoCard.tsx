import { Card, BlockStack, Text, Badge, InlineStack } from "@shopify/polaris"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { useCommonStore } from "@/stores"

export const ShopInfoCard = observer(() => {
  const { t } = useTranslation()
  const commonStore = useCommonStore()
  const shopInfo = commonStore.shopInfo

  if (!shopInfo) {
    return null
  }

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingMd">
            {t("shopInfo.title")}
          </Text>
          {shopInfo.plan.shopifyPlus && (
            <Badge tone="success">Shopify Plus</Badge>
          )}
          {shopInfo.plan.partnerDevelopment && (
            <Badge tone="info">{t("shopInfo.devShop")}</Badge>
          )}
        </InlineStack>

        <BlockStack gap="200">
          <InlineStack gap="200" blockAlign="center">
            <Text as="span" fontWeight="semibold">{t("shopInfo.name")}:</Text>
            <Text as="span">{shopInfo.name}</Text>
          </InlineStack>

          <InlineStack gap="200" blockAlign="center">
            <Text as="span" fontWeight="semibold">{t("shopInfo.domain")}:</Text>
            <Text as="span">{shopInfo.myshopifyDomain}</Text>
          </InlineStack>

          <InlineStack gap="200" blockAlign="center">
            <Text as="span" fontWeight="semibold">{t("shopInfo.order")}:</Text>
            <Text as="span">{shopInfo.order}</Text>
          </InlineStack>

          <InlineStack gap="200" blockAlign="center">
            <Text as="span" fontWeight="semibold">{t("shopInfo.plan")}:</Text>
            <Text as="span">{shopInfo.plan.displayName}</Text>
          </InlineStack>

          <InlineStack gap="200" blockAlign="center">
            <Text as="span" fontWeight="semibold">{t("shopInfo.currency")}:</Text>
            <Text as="span">{shopInfo.currencyCode}</Text>
          </InlineStack>

          <InlineStack gap="200" blockAlign="center">
            <Text as="span" fontWeight="semibold">{t("shopInfo.timezone")}:</Text>
            <Text as="span">{shopInfo.ianaTimezone} ({shopInfo.timezone})</Text>
          </InlineStack>
        </BlockStack>
      </BlockStack>
    </Card>
  )
})

