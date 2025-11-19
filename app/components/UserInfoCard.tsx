import { Card, BlockStack, Text, Badge, InlineStack, Grid } from "@shopify/polaris"
import { observer } from "mobx-react-lite"
import { useTranslation } from "react-i18next"
import { useUserInfoStore } from "@/stores"

export const UserInfoCard = observer(() => {
  const { t } = useTranslation()
  const userInfoStore = useUserInfoStore()
  const userInfo = userInfoStore.userInfo

  if (!userInfo) {
    return null
  }

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingMd">
            {t("userInfo.title")}
          </Text>
          <InlineStack gap="200">
            {userInfo.isShopifyPlus && (
              <Badge tone="success">Shopify Plus</Badge>
            )}
            {userInfo.isPartnerDev && (
              <Badge tone="info">{t("userInfo.devShop")}</Badge>
            )}
            {userInfo.isTrial && (
              <Badge tone="attention">{t("userInfo.trial")}</Badge>
            )}
            {userInfo.isActive && (
              <Badge tone="success">{t("userInfo.active")}</Badge>
            )}
          </InlineStack>
        </InlineStack>

        <Grid columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }}>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm" fontWeight="semibold">
              {t("userInfo.shopInfo")}
            </Text>

            <BlockStack gap="200">
              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.shopName")}:</Text>
                <Text as="span">{userInfo.shopName || "-"}</Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.domain")}:</Text>
                <Text as="span" breakWord>{userInfo.myshopifyDomain || "-"}</Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.email")}:</Text>
                <Text as="span" breakWord>{userInfo.email || "-"}</Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.plan")}:</Text>
                <Text as="span">{userInfo.planDisplayName || "-"}</Text>
              </InlineStack>
            </BlockStack>
          </BlockStack>

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm" fontWeight="semibold">
              {t("userInfo.geography")}
            </Text>

            <BlockStack gap="200">
              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.country")}:</Text>
                <Text as="span">{userInfo.country || "-"}</Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.province")}:</Text>
                <Text as="span">{userInfo.province || "-"}</Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.city")}:</Text>
                <Text as="span">{userInfo.city || "-"}</Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.timezone")}:</Text>
                <Text as="span">{userInfo.ianaTimezone || "-"}</Text>
              </InlineStack>
            </BlockStack>
          </BlockStack>

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm" fontWeight="semibold">
              {t("userInfo.currencyAndLanguage")}
            </Text>

            <BlockStack gap="200">
              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.currency")}:</Text>
                <Text as="span">{userInfo.currencyCode}</Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.appLanguage")}:</Text>
                <Text as="span">{userInfo.appLanguage}</Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.theme")}:</Text>
                <Text as="span">{userInfo.theme}</Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.notifications")}:</Text>
                <Text as="span">
                  {userInfo.notifications ? t("userInfo.enabled") : t("userInfo.disabled")}
                </Text>
              </InlineStack>
            </BlockStack>
          </BlockStack>

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm" fontWeight="semibold">
              {t("userInfo.metadata")}
            </Text>

            <BlockStack gap="200">
              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.installedAt")}:</Text>
                <Text as="span">
                  {new Date(userInfo.installedAt).toLocaleDateString()}
                </Text>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="span" fontWeight="medium">{t("userInfo.lastLogin")}:</Text>
                <Text as="span">
                  {new Date(userInfo.lastLoginAt).toLocaleDateString()}
                </Text>
              </InlineStack>

              {userInfo.trialEndsAt && (
                <InlineStack gap="200">
                  <Text as="span" fontWeight="medium">{t("userInfo.trialEnds")}:</Text>
                  <Text as="span">
                    {new Date(userInfo.trialEndsAt).toLocaleDateString()}
                  </Text>
                </InlineStack>
              )}
            </BlockStack>
          </BlockStack>
        </Grid>
      </BlockStack>
    </Card>
  )
})

