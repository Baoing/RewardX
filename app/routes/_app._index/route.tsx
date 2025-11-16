import type {
  HeadersFunction
} from "react-router"
import {
  Page,
  Layout,
  BlockStack,
  InlineStack,
  Text
} from "@shopify/polaris"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { boundary } from "@shopify/shopify-app-react-router/server"
import { LanguageSwitcher } from "../../components/LanguageSwitcher"
import { ShopInfoCard } from "../../components/ShopInfoCard"
import { UserInfoCard } from "../../components/UserInfoCard"
import { FAQCard } from "../../components/FAQCard"
import { AppEmbedBanner } from "../../components/AppEmbedBanner"
import { useUserInfoStore } from "../../stores"
import { getAppName } from "../../config/app.config"

// 移除 loader，从父路由 (_app.tsx) 继承数据
// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   await authenticate.admin(request)
//   return null
// }

const Index = observer(() => {
  const { t } = useTranslation()
  const userInfoStore = useUserInfoStore()
  const userInfo = userInfoStore.userInfo

  const appName = getAppName()
  const userName = userInfo?.ownerName || userInfo?.shopName || "User"

  return (
    <Page>
      <BlockStack gap="500">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="200">
            <Text as="h1" variant="headingXl">
              {t("home.welcome", { userName, appName })}
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              {t("home.welcomeMessage")}
            </Text>
          </BlockStack>
          <LanguageSwitcher />
        </InlineStack>

        <AppEmbedBanner />

        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <ShopInfoCard />
              <UserInfoCard />
              <FAQCard />
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  )
})

export default Index

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs)
}


