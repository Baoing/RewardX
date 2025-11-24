# RewardX MVP 版本 API 设计

## 📋 概述

MVP 版本专注于**订单抽奖**功能，支持：
- 🎮 游戏类型：九宫格（ninebox）、老虎机（slot）
- 🎯 触发方式：用户购买后凭订单号抽奖
- ⚙️ 管理方式：通过 Max Modal 配置活动

---

## 🗄️ 数据库表设计

### 1. Campaign（抽奖活动）

```typescript
interface Campaign {
  id: string                        // UUID
  userId: string                    // 商家 ID
  name: string                      // 活动名称
  description?: string              // 活动描述
  
  // 游戏配置
  gameType: "ninebox" | "slot"      // 游戏类型
  gameConfig: string                // JSON 配置
  
  // 订单限制
  minOrderAmount?: number           // 最小订单金额
  allowedOrderStatus: string        // "paid" | "fulfilled"
  maxPlaysPerCustomer?: number      // 每个客户最多参与次数
  
  // 时间设置
  startAt?: Date                    // 开始时间（可选）
  endAt?: Date                      // 结束时间（可选）
  
  // 状态
  status: "draft" | "active" | "paused" | "ended"
  isActive: boolean
  
  // 统计
  totalPlays: number
  totalWins: number
  totalOrders: number
  
  createdAt: Date
  updatedAt: Date
  
  // 关联
  prizes: Prize[]
  lotteryEntries: LotteryEntry[]
}
```

### 2. Prize（奖品）

```typescript
interface Prize {
  id: string
  campaignId: string
  
  // 基本信息
  name: string                      // "10% OFF", "No luck"
  description?: string
  
  // 奖品类型和值
  type: "discount_percentage" | "discount_fixed" | "free_gift" | "no_prize"
  discountValue?: number            // 折扣值（10 = 10% 或 $10）
  discountCode?: string             // Shopify 折扣码
  giftProductId?: string            // 赠品产品 ID
  giftVariantId?: string            // 赠品变体 ID
  
  // 中奖概率（百分比）
  chancePercentage: number          // 0-100
  
  // 库存
  totalStock?: number               // null = 无限
  usedStock: number
  
  // 显示
  displayOrder: number              // 排序
  color?: string                    // UI 颜色
  icon?: string                     // 图标
  
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 3. LotteryEntry（抽奖记录）

```typescript
interface LotteryEntry {
  id: string
  campaignId: string
  userId?: string
  
  // 订单信息
  orderId: string                   // 唯一，确保每个订单只能抽一次
  orderNumber: string               // #1001
  orderAmount: number
  orderorder?: string
  customerName?: string
  customerId?: string
  
  // 抽奖结果
  prizeId?: string
  prizeName?: string                // 冗余存储
  prizeType?: string
  prizeValue?: string
  
  // 中奖状态
  isWinner: boolean
  status: "pending" | "claimed" | "expired"
  
  // 折扣码
  discountCode?: string
  discountCodeId?: string
  
  // 使用信息
  claimedAt?: Date
  usedOrderId?: string
  usedOrderAmount?: number
  expiresAt?: Date
  
  // 追踪
  ipAddress?: string
  userAgent?: string
  
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔌 API 接口设计

### 1. 创建活动

**POST** `/api/campaigns/create`

```typescript
// Request
interface CreateCampaignRequest {
  name: string
  description?: string
  gameType: "ninebox" | "slot"
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  startAt?: string              // ISO 8601
  endAt?: string                // ISO 8601
}

// Response
interface CreateCampaignResponse {
  success: boolean
  campaign: Campaign
}

// 示例
{
  "name": "新年抽奖活动",
  "gameType": "ninebox",
  "minOrderAmount": 50,
  "maxPlaysPerCustomer": 1,
  "startAt": "2025-01-01T00:00:00Z",
  "endAt": "2025-01-31T23:59:59Z"
}
```

---

### 2. 获取活动配置

**GET** `/api/campaigns/:campaignId`

```typescript
// Response
interface GetCampaignResponse {
  success: boolean
  campaign: {
    id: string
    name: string
    description?: string
    gameType: string
    gameConfig: object
    minOrderAmount?: number
    maxPlaysPerCustomer?: number
    startAt?: string
    endAt?: string
    status: string
    isActive: boolean
    
    // 统计数据
    stats: {
      totalPlays: number
      totalWins: number
      totalOrders: number
      winRate: number           // 中奖率（自动计算）
    }
    
    // 奖品列表
    prizes: Array<{
      id: string
      name: string
      type: string
      discountValue?: number
      chancePercentage: number
      totalStock?: number
      usedStock: number
      displayOrder: number
      color?: string
      isActive: boolean
    }>
  }
}

// 示例响应
{
  "success": true,
  "campaign": {
    "id": "uuid-xxx",
    "name": "新年抽奖",
    "gameType": "ninebox",
    "status": "active",
    "isActive": true,
    "stats": {
      "totalPlays": 150,
      "totalWins": 75,
      "winRate": 0.5
    },
    "prizes": [
      {
        "id": "prize-1",
        "name": "10% OFF",
        "type": "discount_percentage",
        "discountValue": 10,
        "chancePercentage": 90,
        "displayOrder": 0,
        "color": "#FF6B6B"
      },
      {
        "id": "prize-2",
        "name": "No luck",
        "type": "no_prize",
        "chancePercentage": 0,
        "displayOrder": 1,
        "color": "#95A5A6"
      }
    ]
  }
}
```

---

### 3. 更新活动配置

**PUT** `/api/campaigns/:campaignId`

```typescript
// Request
interface UpdateCampaignRequest {
  name?: string
  description?: string
  gameType?: "ninebox" | "slot"
  minOrderAmount?: number
  maxPlaysPerCustomer?: number
  startAt?: string
  endAt?: string
  status?: "draft" | "active" | "paused" | "ended"
  
  // 奖品配置（完整替换）
  prizes?: Array<{
    id?: string                 // 已存在的奖品 ID（更新）
    name: string
    type: string
    discountValue?: number
    discountCode?: string
    chancePercentage: number
    totalStock?: number
    displayOrder: number
    color?: string
    isActive?: boolean
  }>
}

// Response
interface UpdateCampaignResponse {
  success: boolean
  campaign: Campaign
}

// 示例
{
  "name": "春节抽奖活动",
  "status": "active",
  "prizes": [
    {
      "name": "10% OFF",
      "type": "discount_percentage",
      "discountValue": 10,
      "chancePercentage": 90,
      "displayOrder": 0
    },
    {
      "name": "15% OFF",
      "type": "discount_percentage",
      "discountValue": 15,
      "chancePercentage": 5,
      "displayOrder": 1
    },
    {
      "name": "No luck",
      "type": "no_prize",
      "chancePercentage": 0,
      "displayOrder": 2
    }
  ]
}
```

---

### 4. 验证订单是否可以抽奖

**GET** `/api/lottery/verify-order/:orderId`

```typescript
// Response
interface VerifyOrderResponse {
  success: boolean
  canPlay: boolean
  reason?: string
  order?: {
    id: string
    number: string
    amount: number
    order?: string
    customerName?: string
  }
  campaign?: {
    id: string
    name: string
    gameType: string
  }
  hasPlayed?: boolean           // 该订单是否已经抽过奖
  previousEntry?: LotteryEntry  // 如果已抽奖，返回历史记录
}

// 示例响应 - 可以抽奖
{
  "success": true,
  "canPlay": true,
  "order": {
    "id": "gid://shopify/Order/123",
    "number": "#1001",
    "amount": 99.99,
    "order": "customer@example.com",
    "customerName": "John Doe"
  },
  "campaign": {
    "id": "campaign-uuid",
    "name": "新年抽奖",
    "gameType": "ninebox"
  }
}

// 示例响应 - 不能抽奖（已参与）
{
  "success": true,
  "canPlay": false,
  "reason": "Order has already been used for lottery",
  "hasPlayed": true,
  "previousEntry": {
    "id": "entry-uuid",
    "isWinner": true,
    "prizeName": "10% OFF",
    "discountCode": "NEWYEAR10",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}

// 示例响应 - 不能抽奖（订单金额不足）
{
  "success": true,
  "canPlay": false,
  "reason": "Order amount is below minimum requirement ($50)"
}
```

---

### 5. 执行抽奖

**POST** `/api/lottery/play`

```typescript
// Request
interface PlayLotteryRequest {
  campaignId: string
  orderId: string               // Shopify Order ID
}

// Response
interface PlayLotteryResponse {
  success: boolean
  entry: {
    id: string
    isWinner: boolean
    prize?: {
      id: string
      name: string
      type: string
      discountValue?: number
      discountCode?: string     // 中奖时自动生成
      expiresAt?: string
    }
  }
}

// 示例响应 - 中奖
{
  "success": true,
  "entry": {
    "id": "entry-uuid",
    "isWinner": true,
    "prize": {
      "id": "prize-uuid",
      "name": "10% OFF",
      "type": "discount_percentage",
      "discountValue": 10,
      "discountCode": "NEWYEAR10-ABC123",
      "expiresAt": "2025-02-15T23:59:59Z"
    }
  }
}

// 示例响应 - 未中奖
{
  "success": true,
  "entry": {
    "id": "entry-uuid",
    "isWinner": false
  }
}
```

---

### 6. 获取活动列表

**GET** `/api/campaigns`

```typescript
// Query Parameters
interface GetCampaignsQuery {
  status?: "draft" | "active" | "paused" | "ended"
  page?: number
  limit?: number
}

// Response
interface GetCampaignsResponse {
  success: boolean
  campaigns: Array<{
    id: string
    name: string
    gameType: string
    status: string
    isActive: boolean
    startAt?: string
    endAt?: string
    totalPlays: number
    totalWins: number
    prizesCount: number
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

---

### 7. 删除活动

**DELETE** `/api/campaigns/:campaignId`

```typescript
// Response
interface DeleteCampaignResponse {
  success: boolean
  message: string
}

// 注意：删除活动会级联删除所有奖品和抽奖记录
```

---

### 8. 获取抽奖记录

**GET** `/api/campaigns/:campaignId/entries`

```typescript
// Query Parameters
interface GetEntriesQuery {
  status?: "pending" | "claimed" | "expired"
  isWinner?: boolean
  page?: number
  limit?: number
}

// Response
interface GetEntriesResponse {
  success: boolean
  entries: Array<{
    id: string
    orderNumber: string
    orderAmount: number
    customerName?: string
    orderorder?: string
    isWinner: boolean
    prizeName?: string
    discountCode?: string
    status: string
    createdAt: string
  }>
  pagination: {
    total: number
    page: number
    limit: number
  }
}
```

---

## 🎮 九宫格配置说明

### 九宫格规则

- 总共 9 个格子
- 每个奖品出现在 **2 个格子**上
- `chancePercentage` 是 2 个格子的**合计概率**

### 示例配置

```json
{
  "prizes": [
    {
      "name": "10% OFF",
      "type": "discount_percentage",
      "discountValue": 10,
      "chancePercentage": 90,
      "displayOrder": 0,
      "color": "#FF6B6B"
    },
    {
      "name": "No luck",
      "type": "no_prize",
      "chancePercentage": 0,
      "displayOrder": 1,
      "color": "#95A5A6"
    },
    {
      "name": "15% OFF",
      "type": "discount_percentage",
      "discountValue": 15,
      "chancePercentage": 5,
      "displayOrder": 2,
      "color": "#4ECDC4"
    },
    {
      "name": "Sorry...",
      "type": "no_prize",
      "chancePercentage": 0,
      "displayOrder": 3,
      "color": "#95A5A6"
    },
    {
      "name": "Buy One, Get One",
      "type": "free_gift",
      "giftProductId": "gid://shopify/Product/123",
      "chancePercentage": 5,
      "displayOrder": 4,
      "color": "#F39C12"
    },
    {
      "name": "Sorry",
      "type": "no_prize",
      "chancePercentage": 0,
      "displayOrder": 5,
      "color": "#95A5A6"
    }
  ]
}
```

### 九宫格布局（前端）

```
┌─────────┬─────────┬─────────┐
│ Prize 0 │ Prize 1 │ Prize 2 │
│ 10% OFF │ No luck │ 15% OFF │
├─────────┼─────────┼─────────┤
│ Prize 3 │ CENTER  │ Prize 4 │
│ Sorry   │  START  │  BOGO   │
├─────────┼─────────┼─────────┤
│ Prize 5 │ Prize 0 │ Prize 1 │
│ Sorry   │ 10% OFF │ No luck │
└─────────┴─────────┴─────────┘
```

注意：
- 中心格子用于"开始"按钮
- 周围 8 个格子显示奖品
- 每个奖品出现 2 次（如 Prize 0 在位置 0 和 6）

---

## 🔄 抽奖流程

### 1. 客户下单购买

```
Shopify Order Created
  ↓
Order ID: gid://shopify/Order/123
Order Number: #1001
Amount: $99.99
Status: paid
```

### 2. 验证订单资格

```typescript
// 前端调用
const response = await fetch(`/api/lottery/verify-order/${orderId}`)

if (response.canPlay) {
  // 显示抽奖界面
  showLotteryModal(response.campaign)
} else {
  // 显示不能参与的原因
  showMessage(response.reason)
}
```

### 3. 执行抽奖

```typescript
// 用户点击"开始抽奖"
const result = await fetch("/api/lottery/play", {
  method: "POST",
  body: JSON.stringify({
    campaignId: campaign.id,
    orderId: order.id
  })
})

if (result.entry.isWinner) {
  // 显示中奖动画
  showWinAnimation(result.entry.prize)
  
  // 显示折扣码
  showDiscountCode(result.entry.prize.discountCode)
} else {
  // 显示未中奖
  showNoLuckAnimation()
}
```

### 4. 后端抽奖逻辑

```typescript
// app/routes/api.lottery.play.ts

export const action = async ({ request }: ActionFunctionArgs) => {
  const { campaignId, orderId } = await request.json()
  
  // 1. 验证活动是否有效
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { prizes: { where: { isActive: true } } }
  })
  
  if (!campaign.isActive) {
    return json({ success: false, error: "Campaign is not active" })
  }
  
  // 2. 验证时间范围
  const now = new Date()
  if (campaign.startAt && now < campaign.startAt) {
    return json({ success: false, error: "Campaign has not started" })
  }
  if (campaign.endAt && now > campaign.endAt) {
    return json({ success: false, error: "Campaign has ended" })
  }
  
  // 3. 验证订单
  const order = await shopify.graphql(`
    query getOrder($id: ID!) {
      order(id: $id) {
        id
        name
        totalPriceSet { shopMoney { amount currencyCode } }
        order
        customer { displayName id }
        displayFinancialStatus
      }
    }
  `, { id: orderId })
  
  // 检查订单金额
  if (campaign.minOrderAmount && order.totalPrice < campaign.minOrderAmount) {
    return json({ success: false, error: "Order amount too low" })
  }
  
  // 4. 检查是否已经抽过奖
  const existingEntry = await prisma.lotteryEntry.findUnique({
    where: { orderId }
  })
  
  if (existingEntry) {
    return json({ success: false, error: "Order already used" })
  }
  
  // 5. 抽奖算法
  const selectedPrize = selectPrize(campaign.prizes)
  
  // 6. 生成折扣码（如果中奖）
  let discountCode = null
  if (selectedPrize && selectedPrize.type !== "no_prize") {
    discountCode = await createShopifyDiscountCode(selectedPrize)
  }
  
  // 7. 创建抽奖记录
  const entry = await prisma.lotteryEntry.create({
    data: {
      campaignId,
      orderId,
      orderNumber: order.name,
      orderAmount: order.totalPrice,
      orderorder: order.order,
      customerName: order.customer?.displayName,
      customerId: order.customer?.id,
      prizeId: selectedPrize?.id,
      prizeName: selectedPrize?.name,
      prizeType: selectedPrize?.type,
      prizeValue: selectedPrize?.discountValue?.toString(),
      isWinner: selectedPrize?.type !== "no_prize",
      discountCode,
      status: "pending"
    }
  })
  
  // 8. 更新统计
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      totalPlays: { increment: 1 },
      totalWins: entry.isWinner ? { increment: 1 } : undefined,
      totalOrders: { increment: 1 }
    }
  })
  
  // 9. 更新奖品库存
  if (selectedPrize) {
    await prisma.prize.update({
      where: { id: selectedPrize.id },
      data: { usedStock: { increment: 1 } }
    })
  }
  
  return json({
    success: true,
    entry: {
      id: entry.id,
      isWinner: entry.isWinner,
      prize: entry.isWinner ? {
        id: selectedPrize.id,
        name: selectedPrize.name,
        type: selectedPrize.type,
        discountValue: selectedPrize.discountValue,
        discountCode
      } : null
    }
  })
}

// 抽奖算法
function selectPrize(prizes: Prize[]): Prize | null {
  // 过滤掉库存不足的奖品
  const availablePrizes = prizes.filter(p => 
    !p.totalStock || p.usedStock < p.totalStock
  )
  
  // 按概率抽奖
  const random = Math.random() * 100
  let cumulative = 0
  
  for (const prize of availablePrizes) {
    cumulative += prize.chancePercentage
    if (random <= cumulative) {
      return prize
    }
  }
  
  // 如果没有中奖，返回"未中奖"奖品
  return availablePrizes.find(p => p.type === "no_prize") || null
}
```

---

## 📊 统计数据

### Campaign 统计

Campaign 表中自动维护统计数据：

```typescript
{
  totalPlays: 150,      // 总参与次数
  totalWins: 75,        // 总中奖次数
  totalOrders: 150      // 参与订单数
}

// 计算中奖率
const winRate = (totalWins / totalPlays * 100).toFixed(2) + "%"
```

### 按奖品统计

```typescript
// 查询每个奖品的发放情况
const prizeStats = await prisma.lotteryEntry.groupBy({
  by: ["prizeId"],
  where: {
    campaignId,
    isWinner: true
  },
  _count: { prizeId: true }
})
```

---

## 🎨 前端 Modal 配置界面

### Modal 布局

```
┌─────────────────────────────────────────┐
│  🎰 Campaign Configuration              │
├─────────────────────────────────────────┤
│                                         │
│  Campaign Name: [___________________]  │
│  Description:   [___________________]  │
│                                         │
│  Game Type: ● Nine Box  ○ Slot Machine │
│                                         │
│  ─── Order Requirements ───            │
│  Min Order Amount: [$__] (optional)    │
│  Max Plays Per Customer: [__] (optional)│
│                                         │
│  ─── Schedule (Optional) ───           │
│  Start Date: [____/____/____] [__:__]  │
│  End Date:   [____/____/____] [__:__]  │
│                                         │
│  ─── Rewards (6 slots) ───             │
│  ┌─────────────────────────────────┐  │
│  │ Reward 1                        │  │
│  │ Name: [10% OFF]                 │  │
│  │ Type: [Discount Percentage ▼]   │  │
│  │ Value: [10] %                   │  │
│  │ Chance: [90] %                  │  │
│  │ Stock: [∞ Unlimited]            │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [+ Add Reward] (up to 6)              │
│                                         │
│  ─────────────────────────────────────│
│  [Cancel]          [Save Draft] [Save] │
└─────────────────────────────────────────┘
```

---

## ✅ 实现清单

### 后端 API

- [ ] `POST /api/campaigns/create` - 创建活动
- [ ] `GET /api/campaigns/:id` - 获取活动配置
- [ ] `PUT /api/campaigns/:id` - 更新活动配置
- [ ] `DELETE /api/campaigns/:id` - 删除活动
- [ ] `GET /api/campaigns` - 获取活动列表
- [ ] `GET /api/lottery/verify-order/:orderId` - 验证订单
- [ ] `POST /api/lottery/play` - 执行抽奖
- [ ] `GET /api/campaigns/:id/entries` - 获取抽奖记录

### 前端页面

- [ ] 活动列表页
- [ ] 活动配置 Modal
- [ ] 九宫格游戏界面
- [ ] 老虎机游戏界面
- [ ] 中奖结果展示
- [ ] 抽奖记录列表

### 工具函数

- [ ] 抽奖算法（按概率选择奖品）
- [ ] Shopify 折扣码生成
- [ ] 订单验证逻辑
- [ ] 时间范围检查

---

## 📝 注意事项

1. **订单唯一性**：`orderId` 字段有 `@unique` 约束，确保每个订单只能抽一次
2. **概率总和**：所有奖品的 `chancePercentage` 总和应该 = 100%
3. **库存检查**：抽奖前检查奖品库存，避免超发
4. **折扣码生成**：使用 Shopify Admin API 创建折扣码
5. **时间验证**：检查活动是否在有效期内
6. **事务处理**：抽奖、创建记录、更新统计应在同一事务中完成

需要我继续实现具体的 API 路由代码吗？

