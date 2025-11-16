# RewardX MVP 数据库设计

## 📋 设计概述

MVP 版本专注于**订单抽奖**功能，简化了数据库设计，只保留核心必要字段。

### 设计原则

1. ✅ **简单明了**：字段清晰，易于理解和维护
2. ✅ **订单唯一**：通过 `orderId` 唯一约束确保每个订单只能抽一次
3. ✅ **百分比概率**：使用 `chancePercentage` 而不是权重，更直观
4. ✅ **支持扩展**：预留字段便于后续功能扩展

---

## 🗄️ 数据库表结构

### 1. Campaign（抽奖活动表）

#### 字段说明

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|------|----------|
| `id` | UUID | 活动 ID | ✅ |
| `userId` | UUID | 商家 ID（关联 User 表） | ✅ |
| `name` | String | 活动名称 | ✅ |
| `description` | String | 活动描述 | ❌ |
| `gameType` | String | 游戏类型（ninebox/slot） | ✅ |
| `minOrderAmount` | Float | 最小订单金额限制 | ❌ |
| `allowedOrderStatus` | String | 允许的订单状态（paid/fulfilled） | ✅ |
| `maxPlaysPerCustomer` | Int | 每个客户最多参与次数 | ❌ |
| `startAt` | DateTime | 活动开始时间 | ❌ |
| `endAt` | DateTime | 活动结束时间 | ❌ |
| `status` | String | 活动状态（draft/active/paused/ended） | ✅ |
| `isActive` | Boolean | 是否激活（快速判断） | ✅ |
| `gameConfig` | JSON | 游戏特殊配置 | ✅ |
| `totalPlays` | Int | 总参与次数（自动统计） | ✅ |
| `totalWins` | Int | 总中奖次数（自动统计） | ✅ |
| `totalOrders` | Int | 参与订单数（自动统计） | ✅ |
| `createdAt` | DateTime | 创建时间 | ✅ |
| `updatedAt` | DateTime | 更新时间 | ✅ |

#### 关联关系

- `User` (1:N) - 一个商家可以创建多个活动
- `Prize` (1:N) - 一个活动包含多个奖品
- `LotteryEntry` (1:N) - 一个活动有多条抽奖记录

#### 索引

```prisma
@@index([userId, status])
@@index([status, isActive])
@@index([startAt, endAt])
```

---

### 2. Prize（奖品表）

#### 字段说明

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|------|----------|
| `id` | UUID | 奖品 ID | ✅ |
| `campaignId` | UUID | 所属活动 ID | ✅ |
| `name` | String | 奖品名称（如：10% OFF） | ✅ |
| `description` | String | 奖品描述 | ❌ |
| `type` | String | 奖品类型 | ✅ |
| `discountValue` | Float | 折扣值（10 = 10% 或 $10） | ❌ |
| `discountCode` | String | Shopify 折扣码 | ❌ |
| `giftProductId` | String | 赠品产品 ID | ❌ |
| `giftVariantId` | String | 赠品变体 ID | ❌ |
| `chancePercentage` | Float | 中奖概率（0-100） | ✅ |
| `totalStock` | Int | 总库存（null = 无限） | ❌ |
| `usedStock` | Int | 已使用库存 | ✅ |
| `displayOrder` | Int | 显示顺序 | ✅ |
| `color` | String | UI 颜色（如：#FF6B6B） | ❌ |
| `icon` | String | 图标 URL 或名称 | ❌ |
| `isActive` | Boolean | 是否启用 | ✅ |
| `createdAt` | DateTime | 创建时间 | ✅ |
| `updatedAt` | DateTime | 更新时间 | ✅ |

#### 奖品类型（type）

| 类型 | 说明 | 需要的字段 |
|------|------|-----------|
| `discount_percentage` | 百分比折扣 | `discountValue`, `discountCode` |
| `discount_fixed` | 固定金额折扣 | `discountValue`, `discountCode` |
| `free_gift` | 免费赠品 | `giftProductId`, `giftVariantId` |
| `no_prize` | 未中奖 | - |

#### 关联关系

- `Campaign` (N:1) - 多个奖品属于一个活动
- `LotteryEntry` (1:N) - 一个奖品可能被多次抽中

#### 索引

```prisma
@@index([campaignId, isActive])
@@index([campaignId, displayOrder])
```

---

### 3. LotteryEntry（抽奖记录表）

#### 字段说明

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|------|----------|
| `id` | UUID | 记录 ID | ✅ |
| `campaignId` | UUID | 活动 ID | ✅ |
| `userId` | UUID | 用户 ID（可为空） | ❌ |
| `orderId` | String | Shopify 订单 ID（**唯一**） | ✅ |
| `orderNumber` | String | 订单号（如：#1001） | ✅ |
| `orderAmount` | Float | 订单金额 | ✅ |
| `orderEmail` | String | 订单邮箱 | ❌ |
| `customerName` | String | 客户名称 | ❌ |
| `customerId` | String | Shopify 客户 ID | ❌ |
| `prizeId` | UUID | 中奖奖品 ID | ❌ |
| `prizeName` | String | 奖品名称（冗余存储） | ❌ |
| `prizeType` | String | 奖品类型（冗余存储） | ❌ |
| `prizeValue` | String | 奖品值（冗余存储） | ❌ |
| `isWinner` | Boolean | 是否中奖 | ✅ |
| `status` | String | 状态（pending/claimed/expired） | ✅ |
| `discountCode` | String | 生成的折扣码 | ❌ |
| `discountCodeId` | String | Shopify 折扣码 ID | ❌ |
| `claimedAt` | DateTime | 使用时间 | ❌ |
| `usedOrderId` | String | 使用该折扣码的订单 ID | ❌ |
| `usedOrderAmount` | Float | 使用订单金额 | ❌ |
| `expiresAt` | DateTime | 过期时间 | ❌ |
| `ipAddress` | String | IP 地址 | ❌ |
| `userAgent` | String | User Agent | ❌ |
| `createdAt` | DateTime | 创建时间 | ✅ |
| `updatedAt` | DateTime | 更新时间 | ✅ |

#### 状态（status）

| 状态 | 说明 |
|------|------|
| `pending` | 待使用（已中奖，但折扣码未使用） |
| `claimed` | 已使用（折扣码已使用） |
| `expired` | 已过期（超过有效期） |

#### 关联关系

- `Campaign` (N:1) - 多条记录属于一个活动
- `User` (N:1) - 多条记录属于一个用户（可为空）
- `Prize` (N:1) - 多条记录可能抽中同一个奖品

#### 唯一约束

```prisma
orderId String @unique  // 确保每个订单只能抽一次
```

#### 索引

```prisma
@@index([campaignId, createdAt])
@@index([userId, createdAt])
@@index([orderId])
@@index([orderEmail])
@@index([customerId])
@@index([status])
@@index([isWinner])
```

---

## 🎯 核心功能实现

### 1. 九宫格配置

#### 规则

- 总共 9 个格子
- 中心格子用于"开始"按钮
- 周围 8 个格子显示奖品
- 每个奖品出现在 **2 个格子**上
- 最多配置 **6 个奖品**（包括"未中奖"）

#### 示例数据

```typescript
// Campaign
{
  id: "campaign-uuid",
  name: "新年抽奖",
  gameType: "ninebox",
  gameConfig: JSON.stringify({
    gridSize: 9,
    prizesPerGrid: 2
  })
}

// Prizes
[
  {
    name: "10% OFF",
    type: "discount_percentage",
    discountValue: 10,
    chancePercentage: 90,
    displayOrder: 0,
    color: "#FF6B6B"
  },
  {
    name: "No luck",
    type: "no_prize",
    chancePercentage: 0,
    displayOrder: 1,
    color: "#95A5A6"
  },
  {
    name: "15% OFF",
    type: "discount_percentage",
    discountValue: 15,
    chancePercentage: 5,
    displayOrder: 2,
    color: "#4ECDC4"
  },
  {
    name: "Sorry...",
    type: "no_prize",
    chancePercentage: 0,
    displayOrder: 3,
    color: "#95A5A6"
  },
  {
    name: "Buy One, Get One",
    type: "free_gift",
    giftProductId: "gid://shopify/Product/123",
    chancePercentage: 5,
    displayOrder: 4,
    color: "#F39C12"
  },
  {
    name: "Sorry",
    type: "no_prize",
    chancePercentage: 0,
    displayOrder: 5,
    color: "#95A5A6"
  }
]
```

#### 前端九宫格布局

```
┌─────────┬─────────┬─────────┐
│    0    │    1    │    2    │
│ 10% OFF │ No luck │ 15% OFF │
├─────────┼─────────┼─────────┤
│    3    │  START  │    4    │
│ Sorry   │  BUTTON │  BOGO   │
├─────────┼─────────┼─────────┤
│    5    │    0    │    1    │
│ Sorry   │ 10% OFF │ No luck │
└─────────┴─────────┴─────────┘

// 位置 0, 6 显示 Prize 0 (10% OFF)
// 位置 1, 7 显示 Prize 1 (No luck)
// 位置 2 显示 Prize 2 (15% OFF)
// 位置 3 显示 Prize 3 (Sorry)
// 位置 4 显示 Prize 4 (BOGO)
// 位置 5 显示 Prize 5 (Sorry)
```

---

### 2. 抽奖算法

#### 概率计算

```typescript
function selectPrize(prizes: Prize[]): Prize | null {
  // 1. 过滤掉库存不足的奖品
  const availablePrizes = prizes.filter(prize => {
    if (!prize.totalStock) return true  // 无限库存
    return prize.usedStock < prize.totalStock
  })
  
  // 2. 生成 0-100 的随机数
  const random = Math.random() * 100
  
  // 3. 累加概率，找到中奖奖品
  let cumulative = 0
  for (const prize of availablePrizes) {
    cumulative += prize.chancePercentage
    if (random <= cumulative) {
      return prize
    }
  }
  
  // 4. 如果没有中奖，返回"未中奖"奖品
  return availablePrizes.find(p => p.type === "no_prize") || null
}
```

#### 示例

假设有以下奖品：
- 10% OFF: 90%
- 15% OFF: 5%
- BOGO: 5%
- No luck: 0%

```
random = 35.6

cumulative = 0
0 + 90 = 90, 35.6 <= 90? ✅ 中奖！返回 "10% OFF"

random = 92.3

cumulative = 0
0 + 90 = 90, 92.3 <= 90? ❌
90 + 5 = 95, 92.3 <= 95? ✅ 中奖！返回 "15% OFF"

random = 96.8

cumulative = 0
0 + 90 = 90, 96.8 <= 90? ❌
90 + 5 = 95, 96.8 <= 95? ❌
95 + 5 = 100, 96.8 <= 100? ✅ 中奖！返回 "BOGO"
```

---

### 3. 订单验证

#### 验证逻辑

```typescript
async function verifyOrder(orderId: string, campaignId: string) {
  // 1. 获取活动配置
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId }
  })
  
  if (!campaign) {
    return { canPlay: false, reason: "Campaign not found" }
  }
  
  // 2. 检查活动状态
  if (!campaign.isActive || campaign.status !== "active") {
    return { canPlay: false, reason: "Campaign is not active" }
  }
  
  // 3. 检查时间范围
  const now = new Date()
  if (campaign.startAt && now < campaign.startAt) {
    return { canPlay: false, reason: "Campaign has not started" }
  }
  if (campaign.endAt && now > campaign.endAt) {
    return { canPlay: false, reason: "Campaign has ended" }
  }
  
  // 4. 检查订单是否已经抽过奖
  const existingEntry = await prisma.lotteryEntry.findUnique({
    where: { orderId }
  })
  
  if (existingEntry) {
    return {
      canPlay: false,
      reason: "Order has already been used",
      previousEntry: existingEntry
    }
  }
  
  // 5. 从 Shopify 获取订单信息
  const order = await shopify.graphql(`
    query getOrder($id: ID!) {
      order(id: $id) {
        id
        name
        totalPriceSet { shopMoney { amount } }
        displayFinancialStatus
        email
        customer { displayName id }
      }
    }
  `, { id: orderId })
  
  if (!order) {
    return { canPlay: false, reason: "Order not found" }
  }
  
  // 6. 检查订单状态
  if (order.displayFinancialStatus !== campaign.allowedOrderStatus) {
    return { canPlay: false, reason: "Order status not allowed" }
  }
  
  // 7. 检查订单金额
  if (campaign.minOrderAmount && order.totalPrice < campaign.minOrderAmount) {
    return {
      canPlay: false,
      reason: `Order amount is below minimum ($${campaign.minOrderAmount})`
    }
  }
  
  // 8. 检查客户参与次数限制（如果有）
  if (campaign.maxPlaysPerCustomer && order.customer) {
    const customerPlays = await prisma.lotteryEntry.count({
      where: {
        campaignId,
        customerId: order.customer.id
      }
    })
    
    if (customerPlays >= campaign.maxPlaysPerCustomer) {
      return {
        canPlay: false,
        reason: "Maximum plays per customer reached"
      }
    }
  }
  
  // 9. 通过所有验证
  return {
    canPlay: true,
    order: {
      id: order.id,
      number: order.name,
      amount: order.totalPrice,
      email: order.email,
      customerName: order.customer?.displayName,
      customerId: order.customer?.id
    }
  }
}
```

---

## 📊 数据统计查询

### 1. 活动统计

```typescript
// Campaign 表中已有统计字段
{
  totalPlays: 150,      // 总参与次数
  totalWins: 75,        // 总中奖次数
  totalOrders: 150      // 参与订单数
}

// 计算中奖率
const winRate = (campaign.totalWins / campaign.totalPlays) * 100
```

### 2. 按奖品统计

```typescript
// 查询每个奖品的发放情况
const prizeStats = await prisma.lotteryEntry.groupBy({
  by: ["prizeId"],
  where: {
    campaignId: "campaign-uuid",
    isWinner: true
  },
  _count: { prizeId: true }
})

// 结果
[
  { prizeId: "prize-1", _count: { prizeId: 68 } },  // 10% OFF: 68 次
  { prizeId: "prize-2", _count: { prizeId: 5 } },   // 15% OFF: 5 次
  { prizeId: "prize-3", _count: { prizeId: 2 } }    // BOGO: 2 次
]
```

### 3. 时间趋势统计

```typescript
// 按天统计参与次数
const dailyStats = await prisma.$queryRaw`
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_plays,
    SUM(CASE WHEN is_winner = true THEN 1 ELSE 0 END) as total_wins
  FROM "LotteryEntry"
  WHERE campaign_id = ${campaignId}
  GROUP BY DATE(created_at)
  ORDER BY date DESC
  LIMIT 30
`
```

---

## 🔐 数据完整性保证

### 1. 唯一性约束

```prisma
// LotteryEntry 表
orderId String @unique  // 确保每个订单只能抽一次
```

### 2. 级联删除

```prisma
// Campaign 删除时，自动删除所有奖品和抽奖记录
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// Prize 删除时，LotteryEntry 中的 prizeId 设为 null
prize Prize? @relation(fields: [prizeId], references: [id], onDelete: SetNull)
```

### 3. 事务处理

抽奖操作应在事务中完成：

```typescript
await prisma.$transaction(async (tx) => {
  // 1. 创建抽奖记录
  const entry = await tx.lotteryEntry.create({ ... })
  
  // 2. 更新活动统计
  await tx.campaign.update({
    where: { id: campaignId },
    data: {
      totalPlays: { increment: 1 },
      totalWins: entry.isWinner ? { increment: 1 } : undefined
    }
  })
  
  // 3. 更新奖品库存
  if (entry.prizeId) {
    await tx.prize.update({
      where: { id: entry.prizeId },
      data: { usedStock: { increment: 1 } }
    })
  }
})
```

---

## 📝 数据库迁移

### 应用迁移

```bash
# 1. 生成迁移文件
npx prisma migrate dev --name mvp_lottery_system

# 2. 查看迁移状态
npx prisma migrate status

# 3. 生产环境应用迁移
npx prisma migrate deploy
```

### 回滚（如需要）

```bash
# 1. 查看迁移历史
npx prisma migrate status

# 2. 回滚到指定迁移
# PostgreSQL 支持手动回滚，运行反向 SQL
```

---

## 🎯 下一步

MVP 数据库设计完成后，你可以：

1. ✅ 启动 PostgreSQL
2. ✅ 生成数据库迁移
3. ✅ 实现 API 接口（参考 `MVP_API_DESIGN.md`）
4. ✅ 开发前端界面
5. ✅ 测试抽奖流程

相关文档：
- [API 设计文档](./MVP_API_DESIGN.md)
- [快速开始指南](./QUICK_START.md)
- [数据库配置](./DATABASE_SETUP.md)

