# ColorPicker 组件

## 📋 概述

基于 Shopify Polaris 的专业颜色选择器组件，支持可视化选择和 HEX 输入，并提供"无色"状态的特殊视觉表达。

## 🎯 特性

- ✅ **可视化颜色选择** - 使用 Polaris ColorPicker 组件
- ✅ **HEX 输入支持** - 直接输入 6 位十六进制颜色值
- ✅ **无色状态** - 支持空颜色，显示棋盘格背景 + 斜线
- ✅ **实时预览** - 激活器和输入框旁实时显示颜色
- ✅ **清空功能** - 提供"Clear Color"按钮清空颜色
- ✅ **禁用状态** - 支持禁用交互
- ✅ **自定义标签** - 可自定义 label 和 placeholder

## 📦 使用方法

### 基础使用

```tsx
import { ColorPicker } from "@/components/ColorPicker"

function MyComponent() {
  const [color, setColor] = useState("")

  return (
    <ColorPicker
      label="Background Color"
      color={color}
      onChange={(value) => setColor(value)}
      placeholder="Choose a color"
    />
  )
}
```

### 允许空颜色

```tsx
<ColorPicker
  label="Text Color"
  color={textColor}
  onChange={(value) => setTextColor(value)}
  placeholder="Inherit from theme"
  allowEmpty={true}  // 默认为 true
/>
```

### 禁用状态

```tsx
<ColorPicker
  label="Text Color"
  color={textColor}
  onChange={(value) => setTextColor(value)}
  disabled={true}
/>
```

### 在 MobX Store 中使用

```tsx
import { observer } from "mobx-react-lite"
import { ColorPicker } from "@/components/ColorPicker"

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
    <ColorPicker
      label="Main Background"
      color={styles?.mainBackgroundColor}
      onChange={(value) => updateStyle("mainBackgroundColor", value)}
      placeholder="Default #ffffff"
    />
  )
})
```

## 📝 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `color` | `string \| undefined` | - | 当前颜色值（6位HEX，不含#） |
| `onChange` | `(color: string, id?: string) => void` | - | 颜色变化回调 |
| `label` | `string` | - | 标签文本 |
| `placeholder` | `string` | - | 占位符文本（显示在颜色块旁边） |
| `allowEmpty` | `boolean` | `true` | 是否允许空颜色 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `id` | `string` | - | 组件ID（在回调中返回） |
| `onClickActivator` | `(id?: string) => void` | - | 点击激活器时的回调 |

## 🎨 无色状态的视觉表达

### 1. 棋盘格背景

当颜色为空时，显示经典的棋盘格图案，这是设计软件中表示透明/无色的标准方式：

```scss
background: 
  linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
  linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
  linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
```

### 2. 斜线指示器

在棋盘格上叠加一条斜线，进一步强调"无色"状态：

```tsx
{isEmpty && (
  <div className={styles.emptyIndicator}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="20" x2="20" y2="4" stroke="#999" strokeWidth="2" />
    </svg>
  </div>
)}
```

### 3. "Clear Color" 按钮

当有颜色值时，显示清空按钮：

```tsx
{allowEmpty && hexColor && (
  <button onClick={handleClearColor}>
    Clear Color
  </button>
)}
```

## 📊 颜色格式

### 输入格式

- ✅ `FFFFFF` (6位，不含#)
- ✅ `fff` (3位，自动扩展)
- ✅ `#FFFFFF` (自动移除#)
- ✅ `""` (空字符串，表示无色)

### 输出格式

- 总是返回 6 位大写 HEX（不含#）
- 例如：`FFFFFF`, `000000`, `FF841F`
- 空颜色返回空字符串 `""`

## 🎯 实际应用场景

### 主题颜色配置

```tsx
<BlockStack gap="300">
  <ColorPicker
    label="Primary Color"
    color={primaryColor}
    onChange={(value) => setPrimaryColor(value)}
    placeholder="Default #ff841f"
  />
  
  <ColorPicker
    label="Text Color"
    color={textColor}
    onChange={(value) => setTextColor(value)}
    placeholder="Inherit from theme"
    allowEmpty={true}
  />
</BlockStack>
```

### 样式编辑器

```tsx
// 允许用户自定义或继承主题颜色
<ColorPicker
  label="Module Background"
  color={moduleBackground}
  onChange={(value) => updateStyle("moduleBackground", value)}
  placeholder="Inherit from theme"
  allowEmpty={true}
/>
```

## 🔧 技术实现

### 1. 颜色空间转换

```typescript
// HEX → RGB → HSB
const { red, green, blue } = hexToRgb(`#${hexColor}`)
const hsb = rgbToHsb({ red, green, blue })

// HSB → HEX
const hex = hsbToHex(hsba)
```

### 2. 状态同步

```typescript
useEffect(() => {
  if (!color) {
    setHexColor("")
    return
  }
  
  // 同步外部颜色变化
  const _color = color.toLocaleUpperCase().replace("#", "")
  if (_color === hexColor) return
  
  const { red, green, blue } = hexToRgb(`#${_color}`)
  setPickerColor(rgbToHsb({ red, green, blue }))
  setHexColor(_color)
}, [color, hexColor])
```

### 3. 空颜色处理

```typescript
const handleColorInputChange = (value: string) => {
  const prefValue = value.toLocaleUpperCase().replace("#", "")
  
  // 允许清空
  if (!prefValue && allowEmpty) {
    setHexColor("")
    onChange("", id)
    return
  }
  
  // 正常颜色处理...
}
```

## 🎓 最佳实践

### 1. 提供清晰的占位符

```tsx
// ✅ 好的占位符
<ColorPicker
  placeholder="Inherit from theme"
  placeholder="Default #ff841f"
  
// ❌ 不好的占位符
  placeholder="Color"
  placeholder="#000000"
/>
```

### 2. 使用 allowEmpty 表达继承

```tsx
// ✅ 允许空值表示继承主题颜色
<ColorPicker
  label="Text Color"
  color={textColor}
  onChange={setTextColor}
  placeholder="Inherit from theme"
  allowEmpty={true}
/>
```

### 3. 提供默认值说明

```tsx
// ✅ 在 placeholder 中说明默认值
<ColorPicker
  placeholder="Default #ff841f"
  allowEmpty={true}
/>
```

## 🔗 相关组件

- `CustomCssEditor` - CSS 代码编辑器
- `TextField` - Polaris 文本输入
- `Popover` - Polaris 弹出层

## 📄 许可

MIT

