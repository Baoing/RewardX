# CustomCssEditor 组件

## 📋 概述

基于 CodeMirror 的专业 CSS 编辑器组件，提供语法高亮、代码提示、括号匹配等功能。

## 🎯 特性

- ✅ **语法高亮** - CSS 语法高亮
- ✅ **自动补全** - CSS 属性和值的自动补全
- ✅ **括号匹配** - 自动括号匹配和闭合
- ✅ **代码折叠** - 支持代码块折叠
- ✅ **行号显示** - 显示行号
- ✅ **暗色主题** - 使用 One Dark 主题
- ✅ **搜索功能** - 支持代码搜索
- ✅ **历史记录** - 支持撤销/重做

## 📦 安装依赖

```bash
npm install @uiw/react-codemirror @codemirror/lang-css @codemirror/theme-one-dark
```

## 🔧 使用方法

### 基础使用

```tsx
import CustomCssEditor from "@/components/CustomCssEditor"

function MyComponent() {
  const [css, setCss] = useState("")

  return (
    <CustomCssEditor
      value={css}
      onChange={(value) => setCss(value)}
    />
  )
}
```

### 自定义高度

```tsx
<CustomCssEditor
  value={css}
  onChange={(value) => setCss(value)}
  height="400px"
/>
```

### 自定义占位符

```tsx
<CustomCssEditor
  value={css}
  onChange={(value) => setCss(value)}
  placeholder="/* Enter your CSS code here */"
/>
```

### 只读模式

```tsx
<CustomCssEditor
  value={css}
  editable={false}
/>
```

## 📝 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | - | CSS 代码值 |
| `onChange` | `(value: string) => void` | - | 值变化回调 |
| `height` | `string` | `"250px"` | 编辑器高度 |
| `placeholder` | `string` | `"/* Add your custom CSS here */"` | 占位符文本 |
| `editable` | `boolean` | `true` | 是否可编辑 |
| `readOnly` | `boolean` | `false` | 是否只读 |

更多 props 参考 [react-codemirror](https://uiwjs.github.io/react-codemirror/)

## 🎨 主题

组件使用 **One Dark** 主题，这是一个流行的暗色主题，提供良好的代码可读性。

## ⌨️ 快捷键

- `Ctrl/Cmd + Z` - 撤销
- `Ctrl/Cmd + Shift + Z` - 重做
- `Ctrl/Cmd + F` - 搜索
- `Ctrl/Cmd + /` - 注释/取消注释
- `Tab` - 缩进
- `Shift + Tab` - 取消缩进

## 📚 示例

### 在 MobX Store 中使用

```tsx
import { observer } from "mobx-react-lite"
import CustomCssEditor from "@/components/CustomCssEditor"

const StylesTab = observer(() => {
  const editorStore = useCampaignEditorStore()
  const styles = editorStore.editingCampaign?.styles

  const updateStyle = (field: string, value: string) => {
    editorStore.updateField("styles", {
      ...styles,
      [field]: value
    })
  }

  return (
    <CustomCssEditor
      value={styles?.customCSS || ""}
      onChange={(value) => updateStyle("customCSS", value)}
      height="300px"
    />
  )
})
```

### 与 Polaris 组件配合使用

```tsx
import { BlockStack, Text } from "@shopify/polaris"
import CustomCssEditor from "@/components/CustomCssEditor"

function CustomCssSection() {
  return (
    <BlockStack gap="200">
      <Text as="h3" variant="headingSm">
        Custom CSS
      </Text>
      <Text as="p" tone="subdued" variant="bodySm">
        Add your custom CSS code here
      </Text>
      <CustomCssEditor
        value={customCSS}
        onChange={handleChange}
      />
    </BlockStack>
  )
}
```

## 🔗 相关链接

- [CodeMirror 官方文档](https://codemirror.net/)
- [react-codemirror 文档](https://uiwjs.github.io/react-codemirror/)
- [One Dark 主题](https://github.com/one-dark/vscode-one-dark-theme)

## 📄 许可

MIT

