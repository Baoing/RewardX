# Tailwind CSS 集成指南

## 📦 已安装的包

```bash
npm install -D tailwindcss postcss autoprefixer
```

## 📁 配置文件

### 1. `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        shopify: {
          primary: "#008060",
          hover: "#006e52"
        }
      }
    }
  },
  plugins: []
}
```

### 2. `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

### 3. `app/styles/tailwind.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定义全局样式 */
@layer utilities {
  .animate-spin {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 4. `app/root.tsx`

```typescript
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import "@shopify/polaris/build/esm/styles.css"
import "./styles/tailwind.css"  // 👈 添加这一行
```

## 🎨 使用示例

### LoadingScreen 组件

```typescript
import { useTranslation } from "react-i18next"

export function LoadingScreen() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-shopify-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-sm">
          {t("common.loading")}
        </p>
      </div>
    </div>
  )
}
```

## 🎯 Tailwind 常用类

### 布局
- `flex` - Flexbox 布局
- `items-center` - 垂直居中
- `justify-center` - 水平居中
- `min-h-screen` - 最小高度为屏幕高度

### 间距
- `mx-auto` - 水平自动边距（居中）
- `mb-4` - 下边距 1rem
- `p-4` - 内边距 1rem

### 尺寸
- `w-10` - 宽度 2.5rem
- `h-10` - 高度 2.5rem

### 边框
- `border-4` - 边框宽度 4px
- `rounded-full` - 完全圆角

### 颜色
- `bg-gray-50` - 背景浅灰色
- `text-gray-600` - 文字灰色
- `border-shopify-primary` - 自定义 Shopify 绿色

### 动画
- `animate-spin` - 旋转动画

### 文字
- `text-center` - 文字居中
- `text-sm` - 小号字体

## 🚀 优势

✅ **无行内样式** - 代码更清晰  
✅ **类型安全** - Tailwind 类有 IntelliSense 提示  
✅ **响应式** - 轻松实现移动端适配（`md:`, `lg:` 前缀）  
✅ **可维护性** - 统一的设计系统  
✅ **性能优化** - 只打包使用到的 CSS  
✅ **自定义主题** - 可以扩展 Shopify 品牌色  

## 📚 更多资源

- [Tailwind CSS 官方文档](https://tailwindcss.com/docs)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Tailwind CSS Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

## 🎨 自定义 Shopify 颜色

在 `tailwind.config.js` 中已经添加了 Shopify 品牌色：

```javascript
colors: {
  shopify: {
    primary: "#008060",  // Shopify 绿
    hover: "#006e52"     // Shopify 深绿
  }
}
```

使用方式：
- `bg-shopify-primary` - 背景色
- `text-shopify-primary` - 文字色
- `border-shopify-primary` - 边框色
- `hover:bg-shopify-hover` - 悬停背景色

## 🔧 开发建议

1. **安装 VS Code 插件**：`Tailwind CSS IntelliSense`
2. **使用 `@apply` 提取重复样式**（在 `tailwind.css` 中）
3. **响应式设计**：使用 `sm:`, `md:`, `lg:` 前缀
4. **深色模式**：使用 `dark:` 前缀（需要配置）

---

现在项目已完全集成 Tailwind CSS，所有样式都使用 Tailwind 类，不再有行内样式！🎉


