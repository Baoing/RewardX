# 数据库更新说明 - 支持多种活动类型

## ✅ 已添加字段

### Campaign 表更新

#### 1. **type** 字段（活动类型）

```prisma
type String @default("order")
// order（订单抽奖）, email_form（邮件表单抽奖）, share（分享抽奖）
```

**用途**：区分不同的活动触发方式

| 类型 | 说明 | 使用场景 |
|------|------|---------|
| `order` | 订单抽奖 | 用户购买后凭订单号抽奖 |
| `email_form` | 邮件表单抽奖 | 用户填写邮箱即可参与（收集 Email） |
| `share` | 分享抽奖 | 用户分享后获得抽奖机会（后续扩展） |

#### 2. **gameType** 字段更新（游戏类型）

```prisma
gameType String @default("ninebox")
// wheel（大转盘）, ninebox（九宫格）, slot（老虎机）
```

**新增支持**：`wheel`（大转盘）

| 游戏类型 | 说明 | 特点 |
|---------|------|------|
| `wheel` | 大转盘 | 经典转盘，视觉效果好 |
| `ninebox` | 九宫格 | 9 格布局，每个奖品出现 2 次 |
| `slot` | 老虎机 | 老虎机风格，趣味性强 |

#### 3. **邮件表单配置字段**（新增）

```prisma
// type=email_form 时使用
requireEmail    Boolean  @default(true)   // 是否需要填写邮箱
requireName     Boolean  @default(false)  // 是否需要填写姓名
requirePhone    Boolean  @default(false)  // 是否需要填写电话
```

---

### LotteryEntry 表更新

#### 1. **campaignType** 字段（新增）

```prisma
campaignType String
// order（订单抽奖）, email_form（邮件抽奖）, share（分享抽奖）
```

记录参与抽奖的活动类型，便于统计和查询。

#### 2. **字段调整**

| 原字段名 | 新字段名 | 变化 | 说明 |
|---------|---------|------|------|
| `orderId` | `orderId` | ❌ 改为可选 | 只在 type=order 时必填 |
| `orderNumber` | `orderNumber` | ❌ 改为可选 | - |
| `orderAmount` | `orderAmount` | ❌ 改为可选 | - |
| `orderEmail` | `email` | ✅ 重命名 | 改为通用邮箱字段 |
| - | `phone` | ✅ 新增 | 电话号码（可选） |

---

## 📊 数据库结构

### Campaign（活动表）

```typescript
interface Campaign {
  id: string
  userId: string
  name: string
  description?: string
  
  // === 核心字段 ===
  type: "order" | "email_form" | "share"          // ⭐ 活动类型
  gameType: "wheel" | "ninebox" | "slot"          // ⭐ 游戏类型
  
  // === 订单抽奖配置（type=order）===
  minOrderAmount?: number
  allowedOrderStatus: string
  
  // === 邮件表单配置（type=email_form）===
  requireEmail: boolean                            // ⭐ 是否需要邮箱
  requireName: boolean                             // ⭐ 是否需要姓名
  requirePhone: boolean                            // ⭐ 是否需要电话
  
  // === 参与限制 ===
  maxPlaysPerCustomer?: number
  
  // === 时间设置 ===
  startAt?: Date
  endAt?: Date
  
  // === 状态 ===
  status: string
  isActive: boolean
  
  // === 统计 ===
  totalPlays: number
  totalWins: number
  totalOrders: number
  
  createdAt: Date
  updatedAt: Date
}
```

### LotteryEntry（抽奖记录表）

```typescript
interface LotteryEntry {
  id: string
  campaignId: string
  userId?: string
  
  // === 活动类型 ===
  campaignType: "order" | "email_form" | "share"  // ⭐ 新增
  
  // === 订单信息（type=order）===
  orderId?: string                                 // ⭐ 改为可选
  orderNumber?: string
  orderAmount?: number
  
  // === 用户信息（通用）===
  email?: string                                   // ⭐ 重命名（原 orderEmail）
  customerName?: string
  phone?: string                                   // ⭐ 新增
  customerId?: string
  
  // === 抽奖结果 ===
  prizeId?: string
  prizeName?: string
  prizeType?: string
  prizeValue?: string
  
  // === 中奖状态 ===
  isWinner: boolean
  status: string
  
  // === 折扣码 ===
  discountCode?: string
  discountCodeId?: string
  
  // === 使用信息 ===
  claimedAt?: Date
  usedOrderId?: string
  usedOrderAmount?: number
  expiresAt?: Date
  
  // === 追踪 ===
  ipAddress?: string
  userAgent?: string
  
  createdAt: Date
  updatedAt: Date
}
```

---

## 🎮 支持的活动类型

### 1. 订单抽奖（type=order）

**适用场景**：用户购买后凭订单号抽奖

**配置示例**：
```json
{
  "name": "新年订单抽奖",
  "type": "order",
  "gameType": "wheel",
  "minOrderAmount": 50,
  "allowedOrderStatus": "paid",
  "maxPlaysPerCustomer": 1
}
```

**参与流程**：
1. 用户购买商品
2. 获得订单号
3. 输入订单号参与抽奖
4. 每个订单只能抽一次

---

### 2. 邮件表单抽奖（type=email_form）⭐ 新增

**适用场景**：收集用户邮箱，提升转化率

**配置示例**：
```json
{
  "name": "新用户欢迎抽奖",
  "type": "email_form",
  "gameType": "ninebox",
  "requireEmail": true,
  "requireName": false,
  "requirePhone": false,
  "maxPlaysPerCustomer": 1
}
```

**参与流程**：
1. 用户访问网站
2. 填写邮箱（可选：姓名、电话）
3. 点击抽奖
4. 中奖后获得折扣码

**优势**：
- ✅ 收集 Email 用于后续营销
- ✅ 提升转化率（吸引用户留下信息）
- ✅ 无需购买即可参与
- ✅ 降低参与门槛

---

### 3. 分享抽奖（type=share）🔜 后续扩展

**适用场景**：社交裂变，病毒式传播

**配置示例**：
```json
{
  "name": "分享得抽奖机会",
  "type": "share",
  "gameType": "slot",
  "requireEmail": true
}
```

**参与流程**：
1. 用户填写邮箱
2. 分享到社交媒体
3. 获得抽奖机会
4. 邀请的朋友参与也可获得额外机会

---

## 🎨 支持的游戏类型

### 1. 大转盘（wheel）⭐ 新增

**特点**：
- 经典转盘游戏
- 视觉效果好
- 适合多个奖品（6-12 个）

**配置示例**：
```json
{
  "gameType": "wheel",
  "prizes": [
    { "name": "10% OFF", "chancePercentage": 30 },
    { "name": "15% OFF", "chancePercentage": 20 },
    { "name": "20% OFF", "chancePercentage": 10 },
    { "name": "Free Gift", "chancePercentage": 5 },
    { "name": "No luck", "chancePercentage": 35 }
  ]
}
```

**布局示例**：
```
         [Prize 1]
    [P8]     |     [P2]
         \ | /
      ----●----
         / | \
    [P7]     |     [P3]
         [P6]
```

---

### 2. 九宫格（ninebox）

**特点**：
- 9 格布局
- 每个奖品出现 2 次
- 适合 4-6 个奖品

**配置示例**：
```json
{
  "gameType": "ninebox",
  "prizes": [
    { "name": "10% OFF", "chancePercentage": 60 },
    { "name": "15% OFF", "chancePercentage": 20 },
    { "name": "Free Gift", "chancePercentage": 10 },
    { "name": "No luck", "chancePercentage": 10 }
  ]
}
```

**布局示例**：
```
┌─────┬─────┬─────┐
│ P1  │ P2  │ P3  │
├─────┼─────┼─────┤
│ P4  │START│ P5  │
├─────┼─────┼─────┤
│ P6  │ P1  │ P2  │
└─────┴─────┴─────┘
```

---

### 3. 老虎机（slot）

**特点**：
- 老虎机风格
- 趣味性强
- 适合简单奖品（3-5 个）

**配置示例**：
```json
{
  "gameType": "slot",
  "prizes": [
    { "name": "10% OFF", "chancePercentage": 50 },
    { "name": "20% OFF", "chancePercentage": 20 },
    { "name": "Free Gift", "chancePercentage": 10 },
    { "name": "No luck", "chancePercentage": 20 }
  ]
}
```

---

## 🔌 API 更新

### 1. 创建活动

```typescript
POST /api/campaigns/create

// 订单抽奖
{
  "name": "新年订单抽奖",
  "type": "order",
  "gameType": "wheel",
  "minOrderAmount": 50
}

// 邮件表单抽奖
{
  "name": "新用户欢迎抽奖",
  "type": "email_form",
  "gameType": "ninebox",
  "requireEmail": true,
  "requireName": true,
  "requirePhone": false
}
```

---

### 2. 执行抽奖

```typescript
POST /api/lottery/play

// 订单抽奖
{
  "campaignId": "uuid",
  "type": "order",
  "orderId": "gid://shopify/Order/123"
}

// 邮件表单抽奖
{
  "campaignId": "uuid",
  "type": "email_form",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

---

## 📊 数据库索引

### Campaign 索引

```prisma
@@index([userId, status])
@@index([status, isActive])
@@index([type, status])        // ⭐ 新增：按活动类型查询
@@index([gameType])             // ⭐ 新增：按游戏类型查询
@@index([startAt, endAt])
```

### LotteryEntry 索引

```prisma
@@index([campaignId, createdAt])
@@index([userId, createdAt])
@@index([campaignType])         // ⭐ 新增：按活动类型查询
@@index([orderId])
@@index([email])                // ⭐ 更新：原 orderEmail
@@index([customerId])
@@index([status])
@@index([isWinner])
```

---

## 🔄 数据迁移步骤

### 1. 更新 Prisma Schema

Schema 已更新，包含新字段和索引。

### 2. 生成迁移

```bash
# 生成新的迁移文件
npx prisma migrate dev --name add_campaign_types_and_game_types

# 应用迁移
npx prisma generate
```

### 3. 现有数据迁移（如有）

如果已有数据，需要为现有记录设置默认值：

```sql
-- Campaign 表：设置默认 type 和游戏类型
UPDATE "Campaign" 
SET 
  "type" = 'order',
  "requireEmail" = true,
  "requireName" = false,
  "requirePhone" = false
WHERE "type" IS NULL;

-- LotteryEntry 表：设置默认 campaignType
UPDATE "LotteryEntry"
SET "campaignType" = 'order'
WHERE "campaignType" IS NULL;
```

---

## ✅ 更新总结

### 新增功能

1. ✅ **活动类型（type）**
   - 订单抽奖（order）
   - 邮件表单抽奖（email_form）
   - 分享抽奖（share，预留）

2. ✅ **游戏类型（gameType）**
   - 大转盘（wheel）⭐ 新增
   - 九宫格（ninebox）
   - 老虎机（slot）

3. ✅ **邮件表单配置**
   - requireEmail - 是否需要邮箱
   - requireName - 是否需要姓名
   - requirePhone - 是否需要电话

4. ✅ **灵活的数据字段**
   - orderId 改为可选（只在订单抽奖时必填）
   - 新增 phone 字段
   - email 字段通用化

### 向后兼容

- ✅ 默认 `type="order"`，保持向后兼容
- ✅ 默认 `gameType="ninebox"`
- ✅ 现有 API 仍然可用

---

## 🎯 使用建议

### 订单抽奖活动（Order）

**推荐游戏**：九宫格、大转盘
**适用场景**：
- 提高复购率
- 鼓励大额订单
- 清理库存

### 邮件表单抽奖活动（Email Form）

**推荐游戏**：大转盘、老虎机
**适用场景**：
- 收集 Email
- 提升首次购买转化
- 新用户欢迎礼
- 节日促销

### 分享抽奖活动（Share）

**推荐游戏**：所有类型
**适用场景**：
- 社交裂变
- 品牌传播
- 获客引流

---

## 📚 相关文档

- [MVP API 设计](./MVP_API_DESIGN.md)
- [MVP 数据库设计](./MVP_DATABASE.md)
- [快速开始指南](./QUICK_START.md)

---

需要我提供具体游戏类型的前端实现建议吗？

