import type { ReactNode } from "react"
import { Page, Layout, BlockStack, InlineStack, Button } from "@shopify/polaris"
import { useTranslation } from "react-i18next"
import { LanguageSwitcher } from "../LanguageSwitcher"
import { SettingSectionComponent, type SettingSection } from "./SettingItem"

export interface SettingsPageProps {
  title: string
  sections: SettingSection[]
  primaryAction?: {
    content: string
    onAction: () => void
    loading?: boolean
    disabled?: boolean
  }
  secondaryActions?: Array<{
    content: string
    onAction: () => void
    disabled?: boolean
  }>
  showLanguageSwitcher?: boolean
  headerContent?: ReactNode
  sidebarContent?: ReactNode
}

/**
 * 可复用的设置页面容器
 */
export function SettingsPageContainer({
  title,
  sections,
  primaryAction,
  secondaryActions,
  showLanguageSwitcher = true,
  headerContent,
  sidebarContent
}: SettingsPageProps) {
  const { t } = useTranslation()

  return (
    <Page
      title={title}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      <BlockStack gap="500">
        {/* 页面头部 */}
        {(showLanguageSwitcher || headerContent) && (
          <InlineStack align="space-between" blockAlign="center">
            {headerContent || <div />}
            {showLanguageSwitcher && <LanguageSwitcher />}
          </InlineStack>
        )}

        {/* 主要内容 */}
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              {sections.map((section) => (
                <SettingSectionComponent key={section.id} section={section} />
              ))}
            </BlockStack>
          </Layout.Section>

          {/* 侧边栏内容 */}
          {sidebarContent && (
            <Layout.Section variant="oneThird">
              {sidebarContent}
            </Layout.Section>
          )}
        </Layout>
      </BlockStack>
    </Page>
  )
}


