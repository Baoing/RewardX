# 可复用设置页面系统使用指南

## 🎯 设计理念

基于配置化的设置页面系统，支持快速创建功能丰富的设置页面。

## 📦 核心组件

### 1. SettingItem（设置项组件）

支持多种类型的设置项：
- `select` - 下拉选择
- `text` - 文本输入  
- `checkbox` - 复选框
- `custom` - 自定义渲染

### 2. SettingsPageContainer（设置页面容器）

提供统一的页面布局和结构。

## 🚀 快速使用

### 基础示例

\`\`\`typescript
import { SettingsPageContainer, type SettingSection } from "~/components/settings"

const sections: SettingSection[] = [
  {
    id: "general",
    title: "常规设置",
    description: "管理应用基本设置",
    items: [
      {
        id: "language",
        title: "语言",
        description: "选择界面语言",
        type: "select",
        value: "zh",
        options: [
          { label: "中文", value: "zh" },
          { label: "English", value: "en" }
        ],
        onChange: (value) => console.log(value)
      }
    ]
  }
]

export default function MySettings() {
  return (
    <SettingsPageContainer
      title="设置"
      sections={sections}
    />
  )
}
\`\`\`

### 高级用法

\`\`\`typescript
<SettingsPageContainer
  title="高级设置"
  sections={sections}
  
  // 主要操作按钮
  primaryAction={{
    content: "保存",
    onAction: handleSave,
    loading: isSaving
  }}
  
  // 次要操作
  secondaryActions={[
    {
      content: "重置",
      onAction: handleReset
    }
  ]}
  
  // 显示语言切换器
  showLanguageSwitcher={true}
  
  // 侧边栏内容
  sidebarContent={<HelpCard />}
/>
\`\`\`

## 📋 设置项类型

### Select（下拉选择）

\`\`\`typescript
{
  id: "theme",
  title: "主题",
  type: "select",
  value: "light",
  options: [
    { label: "浅色", value: "light" },
    { label: "深色", value: "dark" }
  ],
  onChange: (value) => setTheme(value)
}
\`\`\`

### Text（文本输入）

\`\`\`typescript
{
  id: "api-key",
  title: "API Key",
  type: "text",
  value: apiKey,
  placeholder: "输入您的 API Key",
  onChange: (value) => setApiKey(value)
}
\`\`\`

### Checkbox（复选框）

\`\`\`typescript
{
  id: "notifications",
  title: "启用通知",
  description: "接收重要更新",
  type: "checkbox",
  checked: true,
  onChange: (checked) => setNotifications(checked)
}
\`\`\`

### Custom（自定义）

\`\`\`typescript
{
  id: "custom",
  title: "自定义设置",
  type: "custom",
  render: () => <MyCustomComponent />
}
\`\`\`

## 🌍 多语言支持

所有设置文本都支持 i18n 翻译：

\`\`\`typescript
const { t } = useTranslation()

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
        // ...
      }
    ]
  }
]
\`\`\`

## ✨ 特性

- ✅ 完全类型安全（TypeScript）
- ✅ 响应式布局
- ✅ 多语言支持
- ✅ 自动状态管理
- ✅ 可扩展的设置项类型
- ✅ 灵活的页面布局
- ✅ 开箱即用的主题支持

## 🎨 自定义样式

设置页面使用 Polaris 组件，自动适配 Shopify 设计规范。

## 💡 最佳实践

1. **逻辑分组** - 将相关设置归类到同一个 section
2. **清晰描述** - 为每个设置项提供简洁的说明
3. **即时保存** - 使用 onChange 立即保存更改
4. **状态管理** - 使用 MobX 或其他状态管理工具
5. **错误处理** - 在 onChange 中处理保存失败的情况

## 📝 完整示例

查看 \`app/routes/_app.settings.tsx\` 了解完整实现。


