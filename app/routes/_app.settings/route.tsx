import { Card, BlockStack, Text, Button } from "@shopify/polaris"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { SettingsPageContainer, type SettingSection } from "../../components/settings"
import { useUserInfoStore, useCommonStore } from "../../stores"
import { SUPPORTED_LANGUAGES } from "../../i18n/languages"

const SettingsPage = observer(() => {
  const { t } = useTranslation()
  const userInfoStore = useUserInfoStore()
  const commonStore = useCommonStore()

  // 语言选项
  const languageOptions = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    label: name,
    value: code
  }))

  // 处理语言切换
  const handleLanguageChange = async (language: string) => {
    // 1. 通过 commonStore 切换语言（会自动同步 i18n）
    commonStore.setLanguage(language as any)
    
    // 2. 保存到数据库
    await userInfoStore.updateLanguage(language)
  }

  // 定义设置组 - 只保留语言选择
  const sections: SettingSection[] = [
    {
      id: "general",
      title: t("settings.general.title"),
      description: t("settings.general.description"),
      items: [
        {
          id: "language",
          title: t("settings.general.language"),
          description: t("settings.general.languageDescription"),
          type: "select",
          value: commonStore.currentLanguage,
          options: languageOptions,
          onChange: handleLanguageChange
        }
      ]
    }
  ]

  // 侧边栏内容
  const sidebarContent = (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          {t("settings.help.title")}
        </Text>
        <Text as="p" variant="bodyMd">
          {t("settings.help.description")}
        </Text>
        <Button onClick={() => window.open("https://docs.smartseo.com", "_blank")}>
          {t("settings.help.viewDocs")}
        </Button>
      </BlockStack>
    </Card>
  )

  return (
    <SettingsPageContainer
      title={t("settings.title")}
      sections={sections}
      showLanguageSwitcher={false}
      sidebarContent={sidebarContent}
    />
  )
})

export default SettingsPage


