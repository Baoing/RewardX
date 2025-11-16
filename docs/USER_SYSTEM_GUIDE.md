# Shopify App Starter - 用户系统使用指南

## 📚 概述

这个 Shopify App Starter 基座已经配置了完整的用户系统，包括：
- 数据库用户模型
- 用户信息自动获取和更新
- Mobx 全局状态管理
- 语言偏好持久化

## 🗄️ 数据库模型

### User 模型

```prisma
model User {
  id            String   @id @default(uuid())
  shop          String   @unique
  email         String?
  shopName      String?
  domain        String?
  
  // 用户配置
  language      String   @default("zh-CN")
  timezone      String?
  currencyCode  String?
  
  // 元数据
  installedAt   DateTime @default(now())
  lastLoginAt   DateTime @default(now())
  isActive      Boolean  @default(true)
  
  // JSON 字段用于存储额外配置
  settings      String?  @default("{}")
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## 🔧 API 端点

### 1. 获取用户信息
```
GET /api/userInfo
```

### 2. 更新用户配置
```
POST /api/updateUser
FormData:
  - language: string
  - timezone: string
  - settings: JSON string
```

## 📦 Mobx Store

### userInfoStore

```typescript
import { useUserInfoStore } from "../stores"

function MyComponent() {
  const userInfoStore = useUserInfoStore()
  
  // 访问用户信息
  console.log(userInfoStore.userInfo)
  console.log(userInfoStore.currentLanguage)
  console.log(userInfoStore.settings)
  
  // 更新语言
  await userInfoStore.updateLanguage("en")
  
  // 更新设置
  await userInfoStore.updateSettings({ theme: "dark" })
}
```

## 🪝 Hooks

### 1. useUserInfoStore (推荐)
使用 Mobx store 访问和更新用户信息：

```typescript
import { observer } from "mobx-react-lite"
import { useUserInfoStore } from "../stores"

export const MyComponent = observer(() => {
  const userInfoStore = useUserInfoStore()
  
  return (
    <div>
      <p>Language: {userInfoStore.currentLanguage}</p>
      <button onClick={() => userInfoStore.updateLanguage("en")}>
        Change to English
      </button>
    </div>
  )
})
```

### 2. useUserInfo
从 Outlet context 获取初始用户信息：

```typescript
import { useUserInfo } from "../hooks/useShopInfo"

export function MyComponent() {
  const userInfo = useUserInfo()
  
  return (
    <div>
      <p>Shop: {userInfo?.shop}</p>
      <p>Email: {userInfo?.email}</p>
      <p>Language: {userInfo?.language}</p>
    </div>
  )
}
```

### 3. useShopInfo
访问店铺信息：

```typescript
import { useShopInfo } from "../hooks/useShopInfo"

export function MyComponent() {
  const shopInfo = useShopInfo()
  
  return (
    <div>
      <p>Shop Name: {shopInfo?.name}</p>
      <p>Domain: {shopInfo?.myshopifyDomain}</p>
      <p>Plan: {shopInfo?.plan.displayName}</p>
    </div>
  )
}
```

### 4. useAppContext
同时访问店铺和用户信息：

```typescript
import { useAppContext } from "../hooks/useShopInfo"

export function MyComponent() {
  const { shopInfo, userInfo } = useAppContext()
  
  return (
    <div>
      <p>Shop: {shopInfo?.name}</p>
      <p>User Language: {userInfo?.language}</p>
    </div>
  )
}
```

## 🌐 语言切换

语言切换器已经集成了自动保存功能：

```typescript
// components/LanguageSwitcher.tsx
// 用户选择语言后会：
// 1. 立即切换 i18n 语言
// 2. 保存到数据库
// 3. 更新 Mobx store
```

## 🔄 自动功能

### 1. 用户创建/更新
每次用户访问 app 时（`_app.tsx` loader）：
- 自动创建或更新用户记录
- 更新 `lastLoginAt` 时间戳
- 同步店铺信息到用户记录

### 2. 语言自动恢复
用户刷新页面时：
- 自动从数据库加载用户保存的语言偏好
- 自动切换到用户的语言

### 3. Mobx Store 初始化
在 `_app.tsx` 中自动初始化：
```typescript
useEffect(() => {
  if (userInfo) {
    userInfoStore.setUserInfo(userInfo)
  }
}, [userInfo])
```

## 💾 保存自定义配置

你可以使用 `settings` 字段保存任何 JSON 数据：

```typescript
import { useUserInfoStore } from "../stores"

function MyComponent() {
  const userInfoStore = useUserInfoStore()
  
  const saveTheme = async (theme: string) => {
    const currentSettings = userInfoStore.settings
    await userInfoStore.updateSettings({
      ...currentSettings,
      theme
    })
  }
  
  const saveNotifications = async (enabled: boolean) => {
    const currentSettings = userInfoStore.settings
    await userInfoStore.updateSettings({
      ...currentSettings,
      notifications: enabled
    })
  }
  
  return (
    <div>
      <button onClick={() => saveTheme("dark")}>Dark Theme</button>
      <button onClick={() => saveNotifications(true)}>Enable Notifications</button>
    </div>
  )
}
```

## 🎯 最佳实践

### 1. 使用 observer 包裹组件
如果使用 Mobx store，记得用 `observer` 包裹：

```typescript
import { observer } from "mobx-react-lite"

export const MyComponent = observer(() => {
  const userInfoStore = useUserInfoStore()
  // 组件会在 store 变化时自动重新渲染
  return <div>{userInfoStore.currentLanguage}</div>
})
```

### 2. 优先使用 Mobx Store
对于需要响应式更新的数据，使用 Mobx store 而不是 context：

❌ 不推荐：
```typescript
const userInfo = useUserInfo() // 只在初始加载时获取
```

✅ 推荐：
```typescript
const userInfoStore = useUserInfoStore() // 响应式更新
```

### 3. 服务器端获取
在 loader 中获取最新数据：

```typescript
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request)
  const user = await getUser(session.shop)
  return json({ user })
}
```

## 📁 文件结构

```
app/
├── routes/
│   ├── _app.tsx                    # 布局 + Store Provider
│   ├── api.userInfo.ts             # 获取用户信息 API
│   └── api.updateUser.ts           # 更新用户配置 API
├── utils/
│   ├── user.server.ts              # 用户操作工具
│   └── shop.server.ts              # 店铺操作工具
├── stores/
│   ├── userInfoStore.ts            # User Mobx Store
│   └── index.ts                    # Store exports
├── hooks/
│   └── useShopInfo.ts              # Context hooks
└── components/
    ├── LanguageSwitcher.tsx        # 语言切换器
    └── ShopInfoCard.tsx            # 店铺信息卡片
```

## 🚀 快速开始示例

创建一个使用用户信息的新页面：

```typescript
// app/routes/_app.settings.tsx
import { observer } from "mobx-react-lite"
import { Page, Card, BlockStack, Select } from "@shopify/polaris"
import { useUserInfoStore } from "../stores"
import { useTranslation } from "react-i18next"

export default observer(function SettingsPage() {
  const { t } = useTranslation()
  const userInfoStore = useUserInfoStore()
  
  return (
    <Page title={t("settings.title")}>
      <Card>
        <BlockStack gap="400">
          <Select
            label="Language"
            options={[
              { label: "English", value: "en" },
              { label: "中文", value: "zh-CN" }
            ]}
            value={userInfoStore.currentLanguage}
            onChange={(value) => userInfoStore.updateLanguage(value)}
          />
        </BlockStack>
      </Card>
    </Page>
  )
})
```

## 🔐 权限配置

已配置的权限（`shopify.app.toml`）：
```toml
scopes = "read_products,write_products,read_customers,read_orders,read_content,read_themes,read_locales"
```

## 📝 注意事项

1. **数据库迁移**：每次修改 Prisma schema 后运行 `npx prisma migrate dev`
2. **TypeScript 类型**：使用 `UserInfo` 类型确保类型安全
3. **错误处理**：Store 中包含 `error` 和 `isLoading` 状态
4. **性能**：使用 `observer` 只在需要的组件中订阅 store 变化

