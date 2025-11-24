# API 工具使用指南

## 概述

项目提供了统一的 API 请求封装工具，简化前端 API 调用，提供标准的错误处理和响应格式。

## 目录结构

```
app/utils/
├── api.client.ts      # 通用 API 客户端（底层封装）
├── api.campaigns.ts   # Campaign 相关 API（业务封装）
├── api.admin.ts       # 管理员 API（需要 ADMIN_SECRET）
└── README.md          # 本文档
```

## ⚠️ 认证说明

项目中有两种不同的 API 认证方式：

### 1. **Shopify Session 认证**（普通用户 API）

- **使用场景**：所有普通用户功能的 API
- **认证方式**：通过 Shopify Session Cookie 自动认证
- **是否需要 Authorization Header**：❌ **不需要**
- **示例 API**：
  - `/api/campaigns`
  - `/api/userInfo`
  - `/api/subscribe`
  - `/api/lottery/play`

**后端实现：**
```typescript
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request)  // ✅ Shopify 自动认证
  // ...
}
```

**前端调用：**
```typescript
import { getCampaigns } from "@/utils/api.campaigns"

// ✅ 不需要手动添加任何 header
const campaigns = await getCampaigns()
```

### 2. **ADMIN_SECRET 认证**（管理员 API）

- **使用场景**：管理员功能（如折扣码管理、手动订阅开通等）
- **认证方式**：通过 `Authorization: Bearer ${ADMIN_SECRET}` header
- **是否需要 Authorization Header**：✅ **需要**
- **示例 API**：
  - `/api/admin/discounts`
  - `/api/admin/subscriptions`

**后端实现：**
```typescript
function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    throw new Response("Unauthorized", { status: 401 })
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  verifyAdmin(request)  // ✅ 验证 ADMIN_SECRET
  // ...
}
```

**前端调用：**
```typescript
import { getDiscounts } from "@/utils/api.admin"

// ✅ 自动添加 Authorization header
const discounts = await getDiscounts()
```

## 核心工具

### 1. API Client（`api.client.ts`）

底层 HTTP 请求封装，基于 `fetch` API。

#### 特性

- ✅ 统一的请求/响应格式
- ✅ 自动错误处理
- ✅ 超时控制
- ✅ 查询参数构建
- ✅ TypeScript 类型支持
- ✅ 请求日志输出

#### 基础用法

```typescript
import { api } from "@/utils/api.client"

// GET 请求
const users = await api.get<User[]>("/api/users")

// POST 请求
const newUser = await api.post<User>("/api/users", {
  name: "John",
  order: "john@example.com"
})

// PUT 请求
const updatedUser = await api.put<User>("/api/users/123", {
  name: "John Doe"
})

// DELETE 请求
await api.delete("/api/users/123")

// 带查询参数的请求
const users = await api.get<User[]>("/api/users", {
  params: {
    page: 1,
    limit: 10,
    status: "active"
  }
})
```

#### 错误处理

```typescript
import { ApiError } from "@/utils/api.client"

try {
  const user = await api.get<User>("/api/users/123")
} catch (error) {
  if (error instanceof ApiError) {
    console.error("API Error:", error.message)
    console.error("Status:", error.status)
    console.error("Response:", error.response)
  }
}
```

#### 自定义配置

```typescript
import { createApiClient } from "@/utils/api.client"

const customApi = createApiClient({
  baseURL: "https://api.example.com",
  timeout: 10000,
  headers: {
    "X-Custom-Header": "value"
  }
})
```

### 2. Campaign API（`api.campaigns.ts`）

Campaign 相关的业务 API 封装。

#### 可用方法

```typescript
import {
  getCampaigns,              // 获取所有活动
  getCampaignById,           // 获取单个活动
  createCampaign,            // 创建活动
  createDefaultCampaign,     // 创建默认活动
  updateCampaign,            // 更新活动
  deleteCampaign,            // 删除活动
  toggleCampaignStatus,      // 切换活动状态
  getCampaignAnalytics,      // 获取活动分析
  getCampaignEntries         // 获取活动记录
} from "@/utils/api.campaigns"
```

#### 使用示例

```typescript
// 获取所有活动
const campaigns = await getCampaigns()

// 获取单个活动
const campaign = await getCampaignById("campaign-id")

// 创建默认活动（九宫格 + Order 抽奖）
const newCampaign = await createDefaultCampaign()

// 创建自定义活动
const customCampaign = await createCampaign({
  name: "Summer Sale",
  description: "Summer sale lottery",
  type: "order",
  gameType: "ninebox",
  minOrderAmount: 50,
  prizes: [
    {
      name: "10% OFF",
      type: "discount_percentage",
      discountValue: 10,
      chancePercentage: 50,
      displayOrder: 0
    }
  ]
})

// 更新活动
const updated = await updateCampaign("campaign-id", {
  status: "active",
  isActive: true
})

// 删除活动
await deleteCampaign("campaign-id")

// 获取分析数据
const analytics = await getCampaignAnalytics("campaign-id")

// 获取抽奖记录
const entries = await getCampaignEntries("campaign-id", {
  page: 1,
  limit: 20,
  status: "pending"
})
```

## 在组件中使用

### React 组件示例

```typescript
import { useState, useEffect } from "react"
import { getCampaigns, createDefaultCampaign } from "@/utils/api.campaigns"
import { ApiError } from "@/utils/api.client"
import { showSuccessToast, showErrorToast } from "@/utils/toast"

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      setIsLoading(true)
      const data = await getCampaigns()
      setCampaigns(data)
    } catch (error) {
      if (error instanceof ApiError) {
        showErrorToast(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      setIsLoading(true)
      const campaign = await createDefaultCampaign()
      showSuccessToast("Campaign created!")
      await loadCampaigns()
    } catch (error) {
      if (error instanceof ApiError) {
        showErrorToast(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleCreate}>Create Campaign</button>
      {/* ... */}
    </div>
  )
}
```

### MobX Store 示例

```typescript
import { makeAutoObservable } from "mobx"
import { getCampaigns } from "@/utils/api.campaigns"
import { ApiError } from "@/utils/api.client"

class CampaignStore {
  campaigns = []
  isLoading = false
  error = null

  constructor() {
    makeAutoObservable(this)
  }

  async fetchCampaigns() {
    this.isLoading = true
    this.error = null

    try {
      const campaigns = await getCampaigns()
      this.campaigns = campaigns
    } catch (error) {
      this.error = error instanceof ApiError 
        ? error.message 
        : "Failed to fetch campaigns"
    } finally {
      this.isLoading = false
    }
  }
}
```

## 类型定义

所有 Campaign 相关的类型定义在 `app/types/campaign.ts` 中：

```typescript
import type {
  Campaign,
  Prize,
  LotteryEntry,
  CampaignAnalytics,
  CreateCampaignRequest,
  UpdateCampaignRequest
} from "@/types/campaign"
```

## 最佳实践

### 1. 统一使用封装的 API 工具

❌ **不推荐：直接使用 fetch**

```typescript
const response = await fetch("/api/campaigns")
const result = await response.json()
if (result.success) {
  setCampaigns(result.campaigns)
}
```

✅ **推荐：使用封装的 API 工具**

```typescript
const campaigns = await getCampaigns()
setCampaigns(campaigns)
```

### 2. 统一的错误处理

✅ **推荐**

```typescript
try {
  const campaign = await getCampaignById(id)
} catch (error) {
  if (error instanceof ApiError) {
    showErrorToast(error.message)
  } else {
    showErrorToast("Unknown error")
  }
}
```

### 3. 使用 Toast 显示提示

```typescript
import { showSuccessToast, showErrorToast } from "@/utils/toast"

try {
  await createDefaultCampaign()
  showSuccessToast("Campaign created successfully!")
} catch (error) {
  showErrorToast(error instanceof ApiError ? error.message : "Failed to create")
}
```

### 4. 避免重复代码

❌ **不推荐：在每个组件中重复请求逻辑**

```typescript
// Component A
const response = await fetch("/api/campaigns")
const result = await response.json()

// Component B
const response = await fetch("/api/campaigns")
const result = await response.json()
```

✅ **推荐：使用 MobX Store 或自定义 Hook**

```typescript
// 在 Store 中统一管理
const campaignStore = useCampaignStore()
await campaignStore.fetchCampaigns()

// 或使用自定义 Hook
const { campaigns, loading, error } = useCampaigns()
```

## API 响应格式

### 成功响应

API 工具会自动解析以下格式的响应：

```json
{
  "success": true,
  "data": { ... }
}
```

并直接返回 `data` 字段的内容。

### 错误响应

```json
{
  "success": false,
  "error": "Error message"
}
```

会抛出 `ApiError` 异常，包含错误信息。

## 日志输出

API 工具会自动输出请求日志：

```
🔍 API Request: POST /api/campaigns/create
✅ API Success: POST /api/campaigns/create
```

或错误日志：

```
🔍 API Request: GET /api/campaigns/123
❌ API Error: 404 Not Found
```

## 扩展指南

### 创建新的业务 API 模块

1. 在 `app/utils/` 下创建新文件，如 `api.users.ts`
2. 导入 `api` 客户端
3. 定义业务方法

```typescript
// app/utils/api.users.ts
import { api } from "./api.client"

export interface User {
  id: string
  name: string
  order: string
}

export const getUsers = async (): Promise<User[]> => {
  return api.get<User[]>("/api/users")
}

export const createUser = async (data: Partial<User>): Promise<User> => {
  return api.post<User>("/api/users", data)
}
```

### 添加请求拦截器

如果需要在所有请求中添加 token 等：

```typescript
import { createApiClient } from "@/utils/api.client"

const apiWithAuth = createApiClient({
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
```

### 3. 管理员 API（`api.admin.ts`）

管理员专用 API 封装，自动添加 `ADMIN_SECRET` 认证。

#### 设置管理员密钥

在使用管理员 API 前，需要先设置 ADMIN_SECRET：

```typescript
import { setAdminSecret } from "@/utils/api.admin"

// 在管理员登录后设置
setAdminSecret("your-admin-secret-here")
```

#### 可用方法

```typescript
import {
  getDiscounts,           // 获取所有折扣码
  getDiscountStats,       // 获取折扣码统计
  createDiscount,         // 创建折扣码
  createBulkDiscounts,    // 批量创建折扣码
  updateDiscount,         // 更新折扣码
  deactivateDiscount      // 停用折扣码
} from "@/utils/api.admin"
```

#### 使用示例

```typescript
import {
  setAdminSecret,
  getDiscounts,
  createDiscount,
  createBulkDiscounts
} from "@/utils/api.admin"

// 1. 设置管理员密钥（通常在登录时）
setAdminSecret(adminSecret)

// 2. 获取所有折扣码
const discounts = await getDiscounts()

// 3. 创建单个折扣码
const discount = await createDiscount({
  code: "SAVE20",
  type: "percentage",
  value: 20,
  description: "20% off for new users",
  maxUsesPerUser: 1,
  expiresAt: new Date("2024-12-31")
})

// 4. 批量创建折扣码
const bulkDiscounts = await createBulkDiscounts({
  prefix: "VIP",
  count: 100,
  type: "percentage",
  value: 15,
  maxUsesPerUser: 1
})

// 5. 更新折扣码
const updated = await updateDiscount("discount-id", {
  isActive: false,
  description: "Expired"
})

// 6. 停用折扣码
await deactivateDiscount("discount-id")
```

#### 管理员界面示例

```typescript
import { useState, useEffect } from "react"
import {
  setAdminSecret,
  getDiscounts,
  createDiscount
} from "@/utils/api.admin"
import { ApiError } from "@/utils/api.client"

const AdminDiscountsPage = () => {
  const [discounts, setDiscounts] = useState([])
  const [adminSecret, setAdminSecretState] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setAdminSecret(adminSecret)
    setIsAuthenticated(true)
    loadDiscounts()
  }

  const loadDiscounts = async () => {
    try {
      const data = await getDiscounts(true) // 包括已停用的
      setDiscounts(data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        alert("Invalid admin secret")
        setIsAuthenticated(false)
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div>
        <input
          type="password"
          value={adminSecret}
          onChange={(e) => setAdminSecretState(e.target.value)}
          placeholder="Enter admin secret"
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Discount Management</h1>
      {/* 折扣码列表 */}
    </div>
  )
}
```

#### ⚠️ 安全注意事项

1. **不要在客户端代码中硬编码 ADMIN_SECRET**
2. **只在安全的管理员界面中使用管理员 API**
3. **定期更换 ADMIN_SECRET**
4. **在生产环境中使用强密码**
5. **考虑添加 IP 白名单限制**

## 总结

### 普通用户 API（推荐使用）

- ✅ 使用 `api.client.ts` 进行底层 HTTP 请求
- ✅ 使用业务封装（如 `api.campaigns.ts`）进行业务调用
- ✅ **不需要**手动添加 Authorization header（Shopify Session 自动处理）
- ✅ 统一错误处理使用 `ApiError`
- ✅ 使用 Toast 显示用户提示
- ✅ 在 Store 中统一管理数据请求
- ✅ 避免直接使用 `fetch`

### 管理员 API（仅管理员使用）

- ✅ 使用 `api.admin.ts` 调用管理员接口
- ✅ **需要**先调用 `setAdminSecret()` 设置密钥
- ✅ 自动添加 `Authorization: Bearer ${ADMIN_SECRET}` header
- ⚠️ 只在安全的管理员界面中使用
- ⚠️ 不要泄露 ADMIN_SECRET

