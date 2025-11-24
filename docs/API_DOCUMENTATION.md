# RewardX API 完整文档

## 📋 概述

RewardX 提供完整的 RESTful API，支持活动管理、抽奖执行和数据统计分析。

### Base URL
```
https://your-app.myshopify.com
```

### 认证
所有 API 请求都需要通过 Shopify App 认证。

---

## 📚 目录

1. [Campaign Management](#campaign-management) - 活动管理
2. [Lottery Operations](#lottery-operations) - 抽奖操作
3. [Analytics](#analytics) - 数据统计
4. [Error Handling](#error-handling) - 错误处理
5. [TypeScript Types](#typescript-types) - 类型定义

---

## Campaign Management

### 1. 创建活动

**POST** `/api/campaigns/create`

创建新的抽奖活动。

#### Request Body

```typescript
{
  name: string                                    // 活动名称 (required)
  description?: string                            // 活动描述
  type: "order" | "order_form" | "share"         // 活动类型 (required)
  gameType: "wheel" | "ninebox" | "slot"         // 游戏类型 (required)
  minOrderAmount?: number                         // 最小订单金额
  maxPlaysPerCustomer?: number                    // 每客户最大参与次数
  requireOrder?: boolean                          // 是否需要邮箱 (type=order_form)
  requireName?: boolean                           // 是否需要姓名 (type=order_form)
  requirePhone?: boolean                          // 是否需要电话 (type=order_form)
  startAt?: string                                // 开始时间 (ISO 8601)
  endAt?: string                                  // 结束时间 (ISO 8601)
  prizes?: Array<{
    name: string                                  // 奖品名称 (required)
    type: string                                  // 奖品类型 (required)
    discountValue?: number                        // 折扣值
    discountCode?: string                         // 折扣码
    giftProductId?: string                        // 赠品产品 ID
    giftVariantId?: string                        // 赠品变体 ID
    chancePercentage: number                      // 中奖概率 0-100 (required)
    totalStock?: number                           // 总库存 (null=无限)
    displayOrder: number                          // 显示顺序 (required)
    color?: string                                // UI 颜色
    icon?: string                                 // 图标
  }>
}
```

#### Response

```typescript
{
  success: boolean
  campaign: {
    id: string
    name: string
    type: string
    gameType: string
    status: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    prizes: Prize[]
  }
}
```

#### Example

```bash
curl -X POST https://your-app.myshopify.com/api/campaigns/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新年抽奖活动",
    "type": "order",
    "gameType": "wheel",
    "minOrderAmount": 50,
    "startAt": "2025-01-01T00:00:00Z",
    "endAt": "2025-01-31T23:59:59Z",
    "prizes": [
      {
        "name": "10% OFF",
        "type": "discount_percentage",
        "discountValue": 10,
        "chancePercentage": 60,
        "displayOrder": 0
      },
      {
        "name": "20% OFF",
        "type": "discount_percentage",
        "discountValue": 20,
        "chancePercentage": 20,
        "displayOrder": 1
      },
      {
        "name": "No luck",
        "type": "no_prize",
        "chancePercentage": 20,
        "displayOrder": 2
      }
    ]
  }'
```

---

### 2. 获取活动详情

**GET** `/api/campaigns/:id`

获取单个活动的详细信息，包括奖品列表和统计数据。

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `id` | string | 活动 ID (required) |

#### Response

```typescript
{
  success: boolean
  campaign: {
    id: string
    userId: string
    name: string
    description?: string
    type: string
    gameType: string
    minOrderAmount?: number
    allowedOrderStatus: string
    maxPlaysPerCustomer?: number
    requireOrder: boolean
    requireName: boolean
    requirePhone: boolean
    startAt?: string
    endAt?: string
    status: string
    isActive: boolean
    totalPlays: number
    totalWins: number
    totalOrders: number
    createdAt: string
    updatedAt: string
    prizes: Prize[]
    stats: {
      totalPlays: number
      totalWins: number
      totalOrders: number
      winRate: number              // 中奖率百分比
      totalEntries: number
    }
  }
}
```

#### Example

```bash
curl https://your-app.myshopify.com/api/campaigns/uuid-xxxx
```

---

### 3. 更新活动

**PUT** `/api/campaigns/:id`

更新活动配置，包括奖品列表。

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `id` | string | 活动 ID (required) |

#### Request Body

```typescript
{
  name?: string
  description?: string
  type?: string
  gameType?: string
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  requireOrder?: boolean
  requireName?: boolean
  requirePhone?: boolean
  startAt?: string
  endAt?: string
  status?: "draft" | "active" | "paused" | "ended"
  prizes?: Prize[]                 // 完整替换奖品列表
}
```

#### Response

```typescript
{
  success: boolean
  campaign: Campaign
}
```

#### Example

```bash
curl -X PUT https://your-app.myshopify.com/api/campaigns/uuid-xxxx \
  -H "Content-Type: application/json" \
  -d '{
    "name": "春节抽奖活动",
    "status": "active"
  }'
```

---

### 4. 删除活动

**DELETE** `/api/campaigns/:id`

删除活动（级联删除所有奖品和抽奖记录）。

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `id` | string | 活动 ID (required) |

#### Response

```typescript
{
  success: boolean
  message: string
}
```

#### Example

```bash
curl -X DELETE https://your-app.myshopify.com/api/campaigns/uuid-xxxx
```

---

### 5. 获取活动列表

**GET** `/api/campaigns`

获取所有活动列表，支持分页和筛选。

#### Query Parameters

| Name | Type | Description |
|------|------|-------------|
| `status` | string | 活动状态筛选 (draft/active/paused/ended) |
| `type` | string | 活动类型筛选 (order/order_form/share) |
| `gameType` | string | 游戏类型筛选 (wheel/ninebox/slot) |
| `page` | number | 页码 (default: 1) |
| `limit` | number | 每页数量 (default: 20, max: 100) |

#### Response

```typescript
{
  success: boolean
  campaigns: Array<{
    id: string
    name: string
    type: string
    gameType: string
    status: string
    isActive: boolean
    startAt?: string
    endAt?: string
    totalPlays: number
    totalWins: number
    totalOrders: number
    prizesCount: number
    entriesCount: number
    createdAt: string
    updatedAt: string
  }>
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
```

#### Example

```bash
# 获取所有活跃的订单抽奖活动
curl "https://your-app.myshopify.com/api/campaigns?status=active&type=order&page=1&limit=20"
```

---

### 6. 获取抽奖记录

**GET** `/api/campaigns/:id/entries`

获取活动的所有抽奖记录。

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `id` | string | 活动 ID (required) |

#### Query Parameters

| Name | Type | Description |
|------|------|-------------|
| `status` | string | 记录状态筛选 (pending/claimed/expired) |
| `isWinner` | boolean | 是否中奖筛选 (true/false) |
| `page` | number | 页码 (default: 1) |
| `limit` | number | 每页数量 (default: 50, max: 100) |

#### Response

```typescript
{
  success: boolean
  entries: Array<{
    id: string
    campaignType: string
    orderId?: string
    orderNumber?: string
    orderAmount?: number
    order?: string
    customerName?: string
    phone?: string
    isWinner: boolean
    prizeName?: string
    prizeType?: string
    discountCode?: string
    status: string
    claimedAt?: string
    createdAt: string
  }>
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
```

#### Example

```bash
# 获取所有中奖记录
curl "https://your-app.myshopify.com/api/campaigns/uuid-xxxx/entries?isWinner=true&page=1"
```

---

## Lottery Operations

### 7. 验证订单

**GET** `/api/lottery/verify-order/:orderId`

验证订单是否可以参与抽奖。

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `orderId` | string | Shopify Order ID (required) |

#### Response

```typescript
{
  success: boolean
  canPlay: boolean
  reason?: string
  hasPlayed?: boolean
  previousEntry?: {
    id: string
    isWinner: boolean
    prizeName?: string
    discountCode?: string
    createdAt: string
  }
  order?: {
    id: string
    number: string
    amount: number
    currency: string
    order?: string
    customerName?: string
    customerId?: string
    phone?: string
  }
  campaign?: {
    id: string
    name: string
    gameType: string
  }
}
```

#### Example

```bash
curl "https://your-app.myshopify.com/api/lottery/verify-order/gid://shopify/Order/123456789"
```

#### Response Examples

**✅ 可以抽奖**
```json
{
  "success": true,
  "canPlay": true,
  "order": {
    "id": "gid://shopify/Order/123",
    "number": "#1001",
    "amount": 99.99,
    "currency": "USD",
    "order": "customer@example.com",
    "customerName": "John Doe"
  },
  "campaign": {
    "id": "uuid-xxxx",
    "name": "新年抽奖",
    "gameType": "wheel"
  }
}
```

**❌ 不能抽奖（已参与）**
```json
{
  "success": true,
  "canPlay": false,
  "reason": "Order has already been used for lottery",
  "hasPlayed": true,
  "previousEntry": {
    "id": "entry-uuid",
    "isWinner": true,
    "prizeName": "10% OFF",
    "discountCode": "LOTTERY-XXX",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**❌ 不能抽奖（订单金额不足）**
```json
{
  "success": true,
  "canPlay": false,
  "reason": "Order amount (30) is below minimum requirement (50)"
}
```

---

### 8. 执行抽奖

**POST** `/api/lottery/play`

执行抽奖操作。

#### Request Body

**订单抽奖**
```typescript
{
  campaignId: string              // 活动 ID (required)
  type: "order"                   // 抽奖类型 (required)
  orderId: string                 // Shopify Order ID (required)
}
```

**邮件表单抽奖**
```typescript
{
  campaignId: string              // 活动 ID (required)
  type: "order_form"              // 抽奖类型 (required)
  order: string                   // 邮箱 (required if requireOrder=true)
  name?: string                   // 姓名 (required if requireName=true)
  phone?: string                  // 电话 (required if requirePhone=true)
}
```

#### Response

**✅ 中奖**
```typescript
{
  success: boolean
  entry: {
    id: string
    isWinner: true
    prize: {
      id: string
      name: string
      type: string
      discountValue?: number
      discountCode?: string
      expiresAt?: string
    }
  }
}
```

**❌ 未中奖**
```typescript
{
  success: boolean
  entry: {
    id: string
    isWinner: false
  }
}
```

#### Examples

**订单抽奖**
```bash
curl -X POST https://your-app.myshopify.com/api/lottery/play \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "uuid-xxxx",
    "type": "order",
    "orderId": "gid://shopify/Order/123456789"
  }'
```

**邮件表单抽奖**
```bash
curl -X POST https://your-app.myshopify.com/api/lottery/play \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "uuid-xxxx",
    "type": "order_form",
    "order": "user@example.com",
    "name": "John Doe"
  }'
```

---

## Analytics

### 9. 获取统计数据

**GET** `/api/campaigns/:id/analytics`

获取活动的详细统计数据，包括 UV、PV、抽奖次数等。

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `id` | string | 活动 ID (required) |

#### Query Parameters

| Name | Type | Description |
|------|------|-------------|
| `startDate` | string | 开始日期 (ISO 8601, optional) |
| `endDate` | string | 结束日期 (ISO 8601, optional) |

#### Response

```typescript
{
  success: boolean
  analytics: {
    // 概览数据
    overview: {
      pv: number                    // 页面浏览量（总参与次数）
      uv: number                    // 独立访客数
      totalEntries: number          // 总抽奖次数
      totalWins: number             // 总中奖次数
      winRate: number               // 中奖率（百分比）
    }
    
    // 按天统计
    daily: Array<{
      date: string
      pv: number
      uv: number
      entries: number
      wins: number
      winRate: number
    }>
    
    // 按奖品统计
    prizes: Array<{
      prizeId: string
      prizeName: string
      count: number                 // 发放数量
      percentage: number            // 占比
    }>
    
    // 按类型统计
    types: Array<{
      type: string
      count: number
    }>
    
    // 订单统计（仅 type=order）
    orders?: {
      totalOrders: number
      totalAmount: number
      avgAmount: number
    }
    
    // 邮件统计
    orders: {
      totalorders: number
      uniqueorders: number
    }
    
    // 时间范围
    dateRange: {
      startDate?: string
      endDate?: string
    }
  }
}
```

#### Example

```bash
# 获取所有时间的统计数据
curl "https://your-app.myshopify.com/api/campaigns/uuid-xxxx/analytics"

# 获取指定时间范围的统计数据
curl "https://your-app.myshopify.com/api/campaigns/uuid-xxxx/analytics?startDate=2025-01-01&endDate=2025-01-31"
```

#### Response Example

```json
{
  "success": true,
  "analytics": {
    "overview": {
      "pv": 1500,
      "uv": 850,
      "totalEntries": 1500,
      "totalWins": 750,
      "winRate": 50
    },
    "daily": [
      {
        "date": "2025-01-15",
        "pv": 150,
        "uv": 85,
        "entries": 150,
        "wins": 75,
        "winRate": 50
      },
      {
        "date": "2025-01-14",
        "pv": 120,
        "uv": 68,
        "entries": 120,
        "wins": 60,
        "winRate": 50
      }
    ],
    "prizes": [
      {
        "prizeId": "prize-1",
        "prizeName": "10% OFF",
        "count": 450,
        "percentage": 30
      },
      {
        "prizeId": "prize-2",
        "prizeName": "20% OFF",
        "count": 300,
        "percentage": 20
      }
    ],
    "types": [
      {
        "type": "order",
        "count": 1500
      }
    ],
    "orders": {
      "totalOrders": 1500,
      "totalAmount": 149850,
      "avgAmount": 99.9
    },
    "orders": {
      "totalorders": 1400,
      "uniqueorders": 850
    },
    "dateRange": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    }
  }
}
```

---

## Error Handling

### Error Response Format

所有错误响应遵循统一格式：

```typescript
{
  success: false
  error: string                    // 错误描述
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | 成功 |
| `400` | 请求参数错误 |
| `401` | 未认证 |
| `403` | 权限不足 |
| `404` | 资源不存在 |
| `500` | 服务器错误 |

### Common Errors

#### 400 Bad Request

```json
{
  "success": false,
  "error": "Name is required"
}
```

```json
{
  "success": false,
  "error": "Total chance percentage must equal 100%, current: 95%"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "error": "Campaign not found"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Database connection failed"
}
```

---

## TypeScript Types

### Campaign

```typescript
interface Campaign {
  id: string
  userId: string
  name: string
  description?: string
  type: "order" | "order_form" | "share"
  gameType: "wheel" | "ninebox" | "slot"
  minOrderAmount?: number
  allowedOrderStatus: string
  maxPlaysPerCustomer?: number
  requireOrder: boolean
  requireName: boolean
  requirePhone: boolean
  startAt?: Date
  endAt?: Date
  status: "draft" | "active" | "paused" | "ended"
  isActive: boolean
  gameConfig: string
  totalPlays: number
  totalWins: number
  totalOrders: number
  createdAt: Date
  updatedAt: Date
  prizes: Prize[]
  lotteryEntries: LotteryEntry[]
}
```

### Prize

```typescript
interface Prize {
  id: string
  campaignId: string
  name: string
  description?: string
  type: "discount_percentage" | "discount_fixed" | "free_gift" | "no_prize"
  discountValue?: number
  discountCode?: string
  giftProductId?: string
  giftVariantId?: string
  chancePercentage: number
  totalStock?: number
  usedStock: number
  displayOrder: number
  color?: string
  icon?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### LotteryEntry

```typescript
interface LotteryEntry {
  id: string
  campaignId: string
  userId?: string
  campaignType: "order" | "order_form" | "share"
  orderId?: string
  orderNumber?: string
  orderAmount?: number
  order?: string
  customerName?: string
  phone?: string
  customerId?: string
  prizeId?: string
  prizeName?: string
  prizeType?: string
  prizeValue?: string
  isWinner: boolean
  status: "pending" | "claimed" | "expired"
  discountCode?: string
  discountCodeId?: string
  claimedAt?: Date
  usedOrderId?: string
  usedOrderAmount?: number
  expiresAt?: Date
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}
```

---

## 使用示例

### 完整抽奖流程

#### 1. 创建活动

```typescript
const createResponse = await fetch("/api/campaigns/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "新年抽奖",
    type: "order",
    gameType: "wheel",
    minOrderAmount: 50,
    prizes: [
      { name: "10% OFF", type: "discount_percentage", discountValue: 10, chancePercentage: 60, displayOrder: 0 },
      { name: "20% OFF", type: "discount_percentage", discountValue: 20, chancePercentage: 20, displayOrder: 1 },
      { name: "No luck", type: "no_prize", chancePercentage: 20, displayOrder: 2 }
    ]
  })
})

const { campaign } = await createResponse.json()
```

#### 2. 激活活动

```typescript
await fetch(`/api/campaigns/${campaign.id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "active" })
})
```

#### 3. 用户参与抽奖

```typescript
// 验证订单
const verifyResponse = await fetch(`/api/lottery/verify-order/${orderId}`)
const verification = await verifyResponse.json()

if (verification.canPlay) {
  // 执行抽奖
  const playResponse = await fetch("/api/lottery/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaignId: campaign.id,
      type: "order",
      orderId
    })
  })
  
  const result = await playResponse.json()
  
  if (result.entry.isWinner) {
    console.log("🎉 中奖了！", result.entry.prize)
  } else {
    console.log("😢 未中奖")
  }
}
```

#### 4. 查看统计数据

```typescript
const analyticsResponse = await fetch(`/api/campaigns/${campaign.id}/analytics`)
const { analytics } = await analyticsResponse.json()

console.log("PV:", analytics.overview.pv)
console.log("UV:", analytics.overview.uv)
console.log("中奖率:", analytics.overview.winRate + "%")
```

---

## 速率限制

目前没有速率限制，但建议：
- 统计接口：每分钟不超过 60 次
- 抽奖接口：每秒不超过 10 次
- 其他接口：每秒不超过 20 次

---

## 支持

如有问题，请查看：
- [数据库设计文档](./MVP_DATABASE.md)
- [快速开始指南](./QUICK_START.md)
- [GitHub Issues](https://github.com/your-repo/issues)

---

**文档版本**: 1.0.0  
**最后更新**: 2025-01-16

