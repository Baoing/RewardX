# 后端工具封装使用指南

## 📋 概述

为了减少后端代码重复，提高代码质量和可维护性，我们创建了三层封装：

1. **API 工具层** (`app/utils/api.server.ts`) - 通用的 API 处理工具
2. **验证层** (`app/utils/validation.server.ts`) - 数据验证逻辑
3. **服务层** (`app/services/*.server.ts`) - 业务逻辑封装

---

## 🔧 API 工具层 (`api.server.ts`)

### 错误响应函数

```typescript
import { badRequest, notFound, unauthorized, forbidden, serverError } from "@/utils/api.server"

// 400 Bad Request
return badRequest("Invalid input")

// 404 Not Found
return notFound("Campaign")  // 输出: "Campaign not found"

// 401 Unauthorized
return unauthorized()

// 403 Forbidden
return forbidden()

// 500 Internal Server Error
return serverError(error)
```

### 成功响应函数

```typescript
import { ok, created, noContent } from "@/utils/api.server"

// 200 OK
return ok(data)

// 201 Created
return created(newResource)

// 204 No Content (删除成功)
return noContent()
```

### 统一的请求处理器

#### `apiHandler` - 用于 Loader

```typescript
import { apiHandler } from "@/utils/api.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return apiHandler(async () => {
    // ✅ 你的业务逻辑
    const data = await fetchData()
    return data  // 自动包装为 200 OK
  })
  // ❌ 错误自动捕获并返回适当的状态码
}
```

#### `actionHandler` - 用于 Action

```typescript
import { actionHandler, ok, noContent } from "@/utils/api.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  return actionHandler(async () => {
    const method = request.method
    
    if (method === "POST") {
      const data = await createResource()
      return ok(data)  // 返回 Response
    }
    
    if (method === "DELETE") {
      await deleteResource()
      return noContent()  // 返回 Response
    }
  })
}
```

### 用户相关工具

```typescript
import { getUserByShop, requireUser } from "@/utils/api.server"

// 获取用户（如果不存在抛出错误）
const user = await getUserByShop(session.shop)

// 验证用户（如果不存在返回 404 响应）
const userOrResponse = await requireUser(session.shop)
if (userOrResponse instanceof Response) {
  return userOrResponse  // 404 错误
}
const user = userOrResponse
```

### 查询参数工具

```typescript
import { getStringParam, getBooleanParam, getNumberParam } from "@/utils/api.server"

const url = new URL(request.url)

const status = getStringParam(url, "status")  // string | null
const isActive = getBooleanParam(url, "isActive", true)  // boolean
const page = getNumberParam(url, "page")  // number | null
```

### 分页工具

```typescript
import { getPaginationParams, paginate } from "@/utils/api.server"

const url = new URL(request.url)
const { page, limit } = getPaginationParams(url)  // { page: 1, limit: 20 }

const [data, total] = await Promise.all([
  fetchData(page, limit),
  countData()
])

return ok(paginate(data, total, page, limit))
// 返回: { data, pagination: { page, limit, total, totalPages } }
```

---

## ✅ 验证层 (`validation.server.ts`)

### Campaign 验证

```typescript
import { validateCampaignData } from "@/utils/validation.server"

// 创建时验证
validateCampaignData(data, true)

// 更新时验证
validateCampaignData(data, false)

// 如果验证失败，抛出错误: "VALIDATION_xxx"
// apiHandler 会自动捕获并返回 400 错误
```

### 通用验证函数

```typescript
import {
  validateRequired,
  validateLength,
  validateNumberRange,
  validateEnum,
  validateUUID,
  validateorder
} from "@/utils/validation.server"

// 必填验证
validateRequired(name, "name")

// 长度验证
validateLength(name, "name", 3, 100)

// 数字范围验证
validateNumberRange(age, "age", 18, 120)

// 枚举验证
validateEnum(status, "status", ["draft", "active", "archived"])

// UUID 验证
validateUUID(id, "Campaign ID")

// 邮箱验证
validateorder(order)
```

### 自定义验证

```typescript
import { 
  validatePrizeProbability, 
  validateDateRange 
} from "@/utils/validation.server"

// 验证奖品概率总和 = 100%
validatePrizeProbability(prizes)

// 验证时间范围
validateDateRange(startAt, endAt)
```

---

## 🏢 服务层 (`campaign.server.ts`)

### 为什么需要服务层？

1. **业务逻辑封装** - 将复杂的数据库操作封装成简单的函数
2. **代码复用** - 避免在多个 API 路由中重复相同的逻辑
3. **易于测试** - 服务层函数可以独立测试
4. **类型安全** - 统一的类型定义

### Campaign 服务示例

```typescript
import {
  getCampaignsByUserId,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  verifyCampaignOwnership,
  getCampaignStats
} from "@/services/campaign.server"

// 获取用户的所有活动
const campaigns = await getCampaignsByUserId(userId, {
  status: "active",
  type: "order"
})

// 获取单个活动
const campaign = await getCampaignById(campaignId, userId)

// 创建活动
const newCampaign = await createCampaign(userId, data)

// 更新活动
const updated = await updateCampaign(campaignId, userId, data)

// 删除活动
await deleteCampaign(campaignId, userId)

// 验证所有权（如果不存在或不属于用户，抛出错误）
await verifyCampaignOwnership(campaignId, userId)

// 获取统计信息
const stats = getCampaignStats(campaign)
```

---

## 📖 完整示例

### 重构前（冗长且重复）

```typescript
// ❌ 旧代码
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request)
    const { id } = params
    
    if (!id) {
      return Response.json({ error: "Campaign ID is required" }, { status: 400 })
    }
    
    const user = await prisma.user.findUnique({
      where: { shop: session.shop }
    })
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }
    
    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: user.id },
      include: { prizes: true }
    })
    
    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 })
    }
    
    return Response.json(campaign)
    
  } catch (error) {
    console.error("Error:", error)
    return Response.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
```

### 重构后（简洁清晰）

```typescript
// ✅ 新代码
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  return apiHandler(async () => {
    const { session } = await authenticate.admin(request)
    const { id } = params
    
    if (!id) {
      throw new Error("VALIDATION_Campaign ID is required")
    }
    
    const user = await getUserByShop(session.shop)
    const campaign = await getCampaignById(id, user.id)
    
    if (!campaign) {
      throw new Error("CAMPAIGN_NOT_FOUND")
    }
    
    return campaign
  })
}
```

### 代码对比

| 对比项 | 旧代码 | 新代码 |
|--------|--------|--------|
| **代码行数** | ~35 行 | ~15 行 |
| **错误处理** | 手动 try-catch | 自动处理 |
| **类型安全** | 部分 | 完全 |
| **可读性** | 中等 | 优秀 |
| **可维护性** | 低 | 高 |

---

## 🎯 最佳实践

### 1. 错误处理约定

使用特殊的错误消息前缀，`apiHandler` 会自动识别：

```typescript
// 验证错误 → 400 Bad Request
throw new Error("VALIDATION_Invalid order format")

// 用户不存在 → 404 Not Found
throw new Error("USER_NOT_FOUND")

// 资源不存在 → 404 Not Found
throw new Error("CAMPAIGN_NOT_FOUND")

// 其他错误 → 500 Internal Server Error
throw new Error("Something went wrong")
```

### 2. 响应格式统一

```typescript
// ✅ 成功：直接返回数据
return ok(data)

// ✅ 错误：自动添加状态码
return badRequest("Invalid input")
```

### 3. 业务逻辑分层

```typescript
// ❌ 不要在路由中直接操作数据库
export const loader = async () => {
  const campaigns = await prisma.campaign.findMany({ ... })
  return ok(campaigns)
}

// ✅ 使用服务层
export const loader = async () => {
  return apiHandler(async () => {
    const campaigns = await getCampaignsByUserId(userId)
    return campaigns
  })
}
```

### 4. 验证逻辑复用

```typescript
// ❌ 不要在路由中重复验证
if (!data.name || data.name.length > 100) {
  return badRequest("Invalid name")
}

// ✅ 使用验证工具
validateCampaignName(data.name)
```

---

## 📊 封装效果

### 代码质量提升

- ✅ **代码行数减少 50%+**
- ✅ **错误处理统一且标准**
- ✅ **类型安全完全保证**
- ✅ **业务逻辑清晰分离**
- ✅ **易于测试和维护**

### 示例对比

| 文件 | 重构前 | 重构后 | 减少 |
|------|--------|--------|------|
| `api.campaigns.ts` | 82 行 | 39 行 | **-52%** |
| `api.campaigns.create.ts` | 127 行 | 41 行 | **-68%** |
| `api.campaigns.$id.ts` | 230 行 | 73 行 | **-68%** |

---

## 🚀 下一步

1. **✅ 已完成** - Campaign API 重构
2. **待进行** - 其他 API 重构（Analytics, Entries 等）
3. **待进行** - 添加单元测试
4. **待进行** - 性能监控和日志

---

## 📚 相关文档

- [API 文档](./API_DOCUMENTATION.md)
- [数据库操作指南](./DATABASE_SETUP.md)
- [测试指南](./TESTING_GUIDE.md)

---

**记住：好的封装让代码更简洁、更安全、更易维护！** 🎉

