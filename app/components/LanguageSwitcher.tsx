import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button, Popover, ActionList, Scrollable } from "@shopify/polaris"
import { LanguageIcon } from "@shopify/polaris-icons"
import { observer } from "mobx-react-lite"
import { SUPPORTED_LANGUAGES, type LanguageCode } from "../i18n/languages"
import { useUserInfoStore, useCommonStore } from "../stores"

export const LanguageSwitcher = observer(() => {
  const { i18n } = useTranslation()
  const userInfoStore = useUserInfoStore()
  const commonStore = useCommonStore()
  const [popoverActive, setPopoverActive] = useState(false)

  const togglePopoverActive = useCallback(
    () => setPopoverActive((active) => !active),
    []
  )

  const handleLanguageChange = useCallback(
    async (shopifyLangCode: LanguageCode) => {
      // 1. 通过 commonStore 切换语言（会自动同步 i18n）
      commonStore.setLanguage(shopifyLangCode)
      
      // 2. 关闭弹窗
      setPopoverActive(false)
      
      // 3. 保存到数据库（Shopify 格式）
      await userInfoStore.updateLanguage(shopifyLangCode)
    },
    [commonStore, userInfoStore]
  )

  const getCurrentLanguageName = () => {
    // 从 commonStore 获取当前语言（Shopify 格式）
    return SUPPORTED_LANGUAGES[commonStore.currentLanguage] || SUPPORTED_LANGUAGES["en"]
  }

  const languageItems = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    content: name,
    onAction: () => handleLanguageChange(code as LanguageCode),
    active: commonStore.currentLanguage === code
  }))

  const activator = (
    <Button
      onClick={togglePopoverActive}
      disclosure
      icon={LanguageIcon}
      loading={userInfoStore.isLoading}
    >
      {getCurrentLanguageName()}
    </Button>
  )

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      autofocusTarget="first-node"
      onClose={togglePopoverActive}
    >
      <Scrollable style={{ maxHeight: "400px" }}>
        <ActionList
          actionRole="menuitem"
          items={languageItems}
        />
      </Scrollable>
    </Popover>
  )
})

