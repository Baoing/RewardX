# API 架构说明

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端组件/页面                            │
│  (_app.campaigns/route.tsx, _app.billing/route.tsx, etc.)  │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─────────── 普通用户操作
                │
┌───────────────▼─────────────────────────────────────────────┐
│                  业务 API 封装层                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ api.campaigns  │  │  api.users     │  │ api.lottery  │  │
│  │    .ts         │  │    .ts         │  │    .ts       │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Client（底层）                          │
│              app/utils/api.client.ts                         │
│   • 统一请求封装                                              │
│   • 错误处理                                                 │
│   • 超时控制                                                 │
│   • 日志输出                                                 │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├────────┬──────────┐
                │        │          │
┌───────────────▼───┐  ┌─▼───────┐ ┌▼────────────────────────┐
│  普通用户 API     │  │管理员API│ │   Shopify API           │
│  /api/campaigns   │  │/api/admin│ │   graphql, rest         │
│  /api/userInfo    │  │/discounts│ │                         │
│  /api/subscribe   │  │          │ │                         │
│                   │  │          │ │                         │
│  认证：Session ✅  │  │认证：     │ │  认证：OAuth Token ✅   │
│  (自动处理)       │  │ADMIN_    │ │  (Shopify 处理)        │
│                   │  │SECRET 🔑 │ │                         │
└───────────────────┘  └──────────┘ └─────────────────────────┘
```

## 认证流程

### 1. 普通用户 API（Session 认证）

```
用户打开应用
    ↓
Shopify OAuth 认证
    ↓
创建 Session (Cookie)
    ↓
前端调用 API
    ↓
后端: authenticate.admin(request)  ← 自动验证 Session
    ↓
返回数据
```

**前端代码：**
```typescript
import { getCampaigns } from "@/utils/api.campaigns"

// ✅ 无需任何 header，Session Cookie 自动发送
const campaigns = await getCampaigns()
```

**后端代码：**
```typescript
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request)  // ✅ Shopify 自动处理
  // session.shop, session.accessToken 等已可用
}
```

### 2. 管理员 API（ADMIN_SECRET 认证）

```
管理员登录
    ↓
输入 ADMIN_SECRET
    ↓
调用 setAdminSecret(secret)
    ↓
存储到 localStorage
    ↓
前端调用管理员 API
    ↓
自动添加 Authorization: Bearer ${secret}
    ↓
后端验证 secret
    ↓
返回数据
```

**前端代码：**
```typescript
import { setAdminSecret, getDiscounts } from "@/utils/api.admin"

// 1. 设置密钥
setAdminSecret("your-secret")

// 2. 调用 API - 自动添加 Authorization header
const discounts = await getDiscounts()
```

**后端代码：**
```typescript
function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    throw new Response("Unauthorized", { status: 401 })
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  verifyAdmin(request)  // ✅ 验证 ADMIN_SECRET
  // 执行管理员操作
}
```

## 工具分层

### 第 1 层：`api.client.ts`（基础层）

**职责**：
- 封装原生 `fetch` API
- 提供 `get`, `post`, `put`, `delete` 等方法
- 统一错误处理（`ApiError`）
- 超时控制
- 请求日志

**使用场景**：
- 其他 API 工具的基础
- 直接调用（不推荐，应使用业务封装层）

### 第 2 层：业务 API 封装（推荐层）

**文件**：
- `api.campaigns.ts` - Campaign 相关
- `api.admin.ts` - 管理员相关
- `api.users.ts` - 用户相关（待创建）
- `api.lottery.ts` - 抽奖相关（待创建）

**职责**：
- 提供业务语义化的方法名
- 封装请求参数构造
- 封装响应数据解析
- 类型安全

**使用场景**：
- ✅ **推荐**：在组件/Store 中使用

### 第 3 层：MobX Store（状态管理层）

**文件**：
- `campaignStore.ts`
- `userInfoStore.ts`
- 等

**职责**：
- 使用业务 API 获取数据
- 管理应用状态
- 提供响应式数据

**使用场景**：
- ✅ **推荐**：在 React 组件中使用

## 文件依赖关系

```
React 组件
    ↓ 使用
MobX Store (campaignStore.ts)
    ↓ 使用
业务 API (api.campaigns.ts)
    ↓ 使用
API Client (api.client.ts)
    ↓ 调用
后端 API (/api/campaigns)
```

## 快速决策表

| 场景 | 使用工具 | 是否需要 Auth Header |
|------|---------|-------------------|
| 获取活动列表 | `api.campaigns.ts` → `getCampaigns()` | ❌ 不需要 |
| 创建活动 | `api.campaigns.ts` → `createCampaign()` | ❌ 不需要 |
| 更新用户信息 | `api.users.ts` → `updateUser()` | ❌ 不需要 |
| 订阅套餐 | `api.subscription.ts` → `subscribe()` | ❌ 不需要 |
| **管理折扣码** | `api.admin.ts` → `getDiscounts()` | ✅ **需要** |
| **手动开通订阅** | `api.admin.ts` → `grantSubscription()` | ✅ **需要** |

## 关键要点

### ✅ DO（推荐）

1. **使用业务 API 封装**
   ```typescript
   // ✅ Good
   import { getCampaigns } from "@/utils/api.campaigns"
   const campaigns = await getCampaigns()
   ```

2. **使用 ApiError 处理错误**
   ```typescript
   // ✅ Good
   try {
     await createCampaign(data)
   } catch (error) {
     if (error instanceof ApiError) {
       showErrorToast(error.message)
     }
   }
   ```

3. **使用 MobX Store 管理状态**
   ```typescript
   // ✅ Good
   const campaignStore = useCampaignStore()
   await campaignStore.fetchCampaigns()
   ```

4. **管理员 API 先设置密钥**
   ```typescript
   // ✅ Good
   setAdminSecret(secret)
   const discounts = await getDiscounts()
   ```

### ❌ DON'T（避免）

1. **不要直接使用 fetch**
   ```typescript
   // ❌ Bad
   const response = await fetch("/api/campaigns")
   const data = await response.json()
   ```

2. **不要手动添加 Session 认证头**
   ```typescript
   // ❌ Bad - Session 会自动处理
   const campaigns = await api.get("/api/campaigns", {
     headers: { "Authorization": "Bearer token" }
   })
   ```

3. **不要在普通 API 中使用 ADMIN_SECRET**
   ```typescript
   // ❌ Bad - 普通 API 不需要
   const campaigns = await getCampaigns()  // 已自动认证
   ```

4. **不要硬编码 ADMIN_SECRET**
   ```typescript
   // ❌ Bad - 安全风险
   setAdminSecret("hardcoded-secret-here")
   ```

## 添加新 API 的步骤

### 1. 创建业务 API 文件

```typescript
// app/utils/api.products.ts
import { api } from "./api.client"

export interface Product {
  id: string
  name: string
  price: number
}

export const getProducts = async (): Promise<Product[]> => {
  return api.get<Product[]>("/api/products")
}

export const createProduct = async (data: Partial<Product>): Promise<Product> => {
  return api.post<Product>("/api/products", data)
}
```

### 2. 在 Store 中使用

```typescript
// app/stores/productStore.ts
import { makeAutoObservable } from "mobx"
import { getProducts } from "@/utils/api.products"

class ProductStore {
  products = []

  constructor() {
    makeAutoObservable(this)
  }

  async fetchProducts() {
    const products = await getProducts()
    this.products = products
  }
}
```

### 3. 在组件中使用

```typescript
// app/routes/_app.products/route.tsx
import { useProductStore } from "@/stores"

const ProductsPage = observer(() => {
  const productStore = useProductStore()

  useEffect(() => {
    productStore.fetchProducts()
  }, [])

  // ...
})
```

## 总结

- ✅ **普通 API**：使用 `api.campaigns.ts` 等业务封装，**不需要** Authorization header
- ✅ **管理员 API**：使用 `api.admin.ts`，**需要**先调用 `setAdminSecret()`
- ✅ 统一使用 `ApiError` 处理错误
- ✅ 在 Store 中管理数据请求
- ❌ 避免直接使用 `fetch`

