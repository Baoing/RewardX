import type { ReactNode } from "react"
import { Card, BlockStack, InlineStack, Text, Button, Select, TextField, Checkbox } from "@shopify/polaris"
import { useTranslation } from "react-i18next"

/**
 * 设置项基础接口
 */
export interface SettingItemBase {
  id: string
  title: string
  description?: string
  type: "select" | "text" | "checkbox" | "toggle" | "custom"
}

/**
 * 下拉选择类型设置项
 */
export interface SelectSettingItem extends SettingItemBase {
  type: "select"
  value: string
  options: Array<{ label: string; value: string }>
  onChange: (value: string) => void
}

/**
 * 文本输入类型设置项
 */
export interface TextSettingItem extends SettingItemBase {
  type: "text"
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

/**
 * 复选框类型设置项
 */
export interface CheckboxSettingItem extends SettingItemBase {
  type: "checkbox"
  checked: boolean
  onChange: (checked: boolean) => void
}

/**
 * 自定义类型设置项
 */
export interface CustomSettingItem extends SettingItemBase {
  type: "custom"
  render: () => ReactNode
}

export type SettingItem =
  | SelectSettingItem
  | TextSettingItem
  | CheckboxSettingItem
  | CustomSettingItem

/**
 * 设置组接口
 */
export interface SettingSection {
  id: string
  title: string
  description?: string
  items: SettingItem[]
  footer?: ReactNode
}

/**
 * 设置项组件
 */
export function SettingItemComponent({ item }: { item: SettingItem }) {
  const { t } = useTranslation()

  const renderControl = () => {
    switch (item.type) {
      case "select":
        return (
          <Select
            label=""
            options={item.options}
            value={item.value}
            onChange={item.onChange}
          />
        )

      case "text":
        return (
          <TextField
            label=""
            value={item.value}
            placeholder={item.placeholder}
            onChange={item.onChange}
            autoComplete="off"
          />
        )

      case "checkbox":
        return (
          <Checkbox
            label=""
            checked={item.checked}
            onChange={item.onChange}
          />
        )

      case "custom":
        return item.render()

      default:
        return null
    }
  }

  return (
    <InlineStack align="space-between" blockAlign="center">
      <BlockStack gap="100">
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {item.title}
        </Text>
        {item.description && (
          <Text as="span" variant="bodySm" tone="subdued">
            {item.description}
          </Text>
        )}
      </BlockStack>
      <div style={{ minWidth: "200px" }}>{renderControl()}</div>
    </InlineStack>
  )
}

/**
 * 设置组件
 */
export function SettingSectionComponent({ section }: { section: SettingSection }) {
  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            {section.title}
          </Text>
          {section.description && (
            <Text as="p" variant="bodyMd" tone="subdued">
              {section.description}
            </Text>
          )}
        </BlockStack>

        <BlockStack gap="400">
          {section.items.map((item) => (
            <SettingItemComponent key={item.id} item={item} />
          ))}
        </BlockStack>

        {section.footer && <BlockStack gap="200">{section.footer}</BlockStack>}
      </BlockStack>
    </Card>
  )
}


