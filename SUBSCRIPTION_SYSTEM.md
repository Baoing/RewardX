# Shopify 订阅系统完整架构文档

## 📊 数据库设计

### 核心表结构

#### 1. **Subscription** - 订阅表
- 存储用户的订阅信息
- 支持多种状态：pending, active, cancelled, expired, past_due
- 支持试用期、手动开通、折扣等功能

#### 2. **UsageRecord** - 使用量记录表
- 记录每次 API 调用/功能使用
- 用于配额统计和用户行为分析

#### 3. **Payment** - 支付记录表
- 记录所有支付事件
- 关联 Shopify 的 ChargeId

#### 4. **Discount** - 折扣表
- 支持百分比、固定金额、试用延长等类型
- 灵活的使用限制和有效期设置

#### 5. **AnalyticsEvent** - 分析事件表
- 记录所有关键业务事件
- 用于后续数据分析和增长统计

---

## 🔧 核心服务

### 1. **SubscriptionService** (`app/services/subscription.server.ts`)

主要功能：
- ✅ 创建订阅（支持试用、折扣、手动开通）
- ✅ 激活订阅（Shopify 回调后）
- ✅ 取消订阅
- ✅ 配额检查和消耗
- ✅ 配额自动重置

### 2. **DiscountService** (`app/services/discount.server.ts`)

主要功能：
- ✅ 创建折扣码
- ✅ 批量生成折扣码
- ✅ 折扣验证和应用
- ✅ 使用统计

---

## 🌟 核心功能

### 1️⃣ 套餐配置

```typescript
const PLAN_CONFIG = {
  free: {
    monthly: { price: 0, quota: 20 },
    yearly: { price: 0, quota: 20 }
  },
  starter: {
    monthly: { price: 9.9, quota: 100 },
    yearly: { price: 99, quota: 100 }
  },
  professional: {
    monthly: { price: 29.9, quota: 500 },
    yearly: { price: 299, quota: 500 }
  },
  enterprise: {
    monthly: { price: 99.9, quota: 2000 },
    yearly: { price: 999, quota: 2000 }
  }
}
```

### 2️⃣ 试用期

- **Starter/Professional**: 7 天试用
- **Enterprise**: 14 天试用
- **Free**: 无试用期

### 3️⃣ 配额管理

```typescript
// 检查配额
const { hasQuota, remaining } = await checkQuota(userId)

// 消耗配额
const success = await consumeQuota(
  userId,
  "optimize_meta",
  1,
  { productId: "123" }
)
```

### 4️⃣ 折扣系统

支持三种折扣类型：
- **percentage**: 百分比折扣（如 20% off）
- **fixed**: 固定金额折扣（如 $10 off）
- **trial_extension**: 试用期延长

---

## 🔌 API 使用示例

### 用户订阅流程

```typescript
// 1. 用户点击订阅按钮
const response = await fetch("/api/subscribe", {
  method: "POST",
  body: formData // planType, billingCycle, discountCode
})

// 2. 跳转到 Shopify 确认页面
const { confirmationUrl } = await response.json()
window.top.location.href = confirmationUrl

// 3. 用户确认后，Shopify 重定向到回调
// /app/billing/callback?charge_id=xxx

// 4. 后端激活订阅
await activateSubscription(subscriptionId, shopifyData)
```

### 管理员手动开通套餐

```bash
curl -X POST https://your-app.com/api/admin/subscriptions \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "grant",
    "shop": "example.myshopify.com",
    "planType": "professional",
    "billingCycle": "monthly",
    "grantedBy": "admin@example.com",
    "grantReason": "试用客户转化",
    "durationDays": 30
  }'
```

### 创建折扣码

```bash
# 创建单个折扣码
curl -X POST https://your-app.com/api/admin/discounts \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d 'action=create' \
  -d 'code=WELCOME20' \
  -d 'type=percentage' \
  -d 'value=20' \
  -d 'maxUsesPerUser=1' \
  -d 'description=新用户欢迎优惠'

# 批量创建折扣码
curl -X POST https://your-app.com/api/admin/discounts \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d 'action=createBulk' \
  -d 'prefix=PROMO' \
  -d 'count=100' \
  -d 'type=percentage' \
  -d 'value=15' \
  -d 'maxUsesPerUser=1'

# 结果: PROMO0001, PROMO0002, ..., PROMO0100
```

---

## 📈 统计分析

### 事件类型

所有关键业务事件都会记录到 `AnalyticsEvent` 表：

- `subscription_created` - 订阅创建
- `subscription_activated` - 订阅激活
- `subscription_cancelled` - 订阅取消
- `payment_succeeded` - 支付成功
- `payment_failed` - 支付失败
- `quota_exceeded` - 配额超限
- `trial_started` - 试用开始
- `trial_ended` - 试用结束

### 查询示例

```typescript
// 按日统计新订阅
const dailySubscriptions = await prisma.$queryRaw`
  SELECT 
    DATE(timestamp) as date,
    COUNT(*) as count
  FROM AnalyticsEvent
  WHERE eventType = 'subscription_created'
  GROUP BY DATE(timestamp)
  ORDER BY date DESC
`

// 套餐分布
const planDistribution = await prisma.subscription.groupBy({
  by: ['planType', 'status'],
  _count: true
})

// 月度收入（MRR）
const mrr = await prisma.subscription.aggregate({
  where: {
    status: 'active',
    billingCycle: 'monthly'
  },
  _sum: {
    price: true
  }
})
```

---

## ⏰ 定时任务

### 配额重置（每天执行）

```typescript
// app/cron/reset-quotas.ts
import { resetQuotas } from "../services/subscription.server"

export async function dailyQuotaReset() {
  await resetQuotas()
}
```

### 试用期结束提醒

```typescript
// app/cron/trial-reminders.ts
export async function sendTrialReminders() {
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const expiringTrials = await prisma.subscription.findMany({
    where: {
      isTrial: true,
      status: 'active',
      trialEndAt: {
        lte: threeDaysFromNow,
        gte: new Date()
      }
    },
    include: { user: true }
  })

  // 发送提醒邮件
  for (const sub of expiringTrials) {
    await sendEmail({
      to: sub.user.email,
      subject: "Your trial is ending soon",
      template: "trial-ending"
    })
  }
}
```

---

## 🚀 部署步骤

### 1. 更新数据库

```bash
# 创建迁移
npx prisma migrate dev --name add_subscription_system

# 生成 Prisma Client
npx prisma generate
```

### 2. 设置环境变量

```env
# .env
ADMIN_SECRET=your-secure-random-string-here
```

### 3. 测试订阅流程

```bash
# 启动开发服务器
npm run dev

# 访问 Billing 页面
https://your-app.com/app/billing
```

---

## 💡 最佳实践

### 1. 安全性
- ✅ 管理员 API 使用 Bearer Token 认证
- ✅ 敏感操作记录日志
- ✅ 折扣码大写存储，防止重复

### 2. 性能优化
- ✅ 使用索引优化查询
- ✅ 配额检查先查缓存
- ✅ 批量操作使用事务

### 3. 用户体验
- ✅ 试用期无需支付信息
- ✅ 取消订阅保留到周期结束
- ✅ 配额耗尽前发送通知

### 4. 数据分析
- ✅ 记录所有关键事件
- ✅ 保留完整的元数据
- ✅ 定期导出报表

---

## 📊 监控指标

### 关键指标 (KPIs)

```typescript
// 1. MRR (Monthly Recurring Revenue)
const mrr = await calculateMRR()

// 2. Churn Rate (流失率)
const churnRate = await calculateChurnRate()

// 3. LTV (Lifetime Value)
const ltv = await calculateLTV()

// 4. 试用转化率
const conversionRate = await calculateTrialConversion()

// 5. 平均配额使用率
const avgQuotaUsage = await calculateAvgQuotaUsage()
```

---

## 🔄 后续扩展

### 1. 增值服务
- [ ] 按需付费（超出配额部分）
- [ ] 附加功能包
- [ ] API 调用计费

### 2. 营销功能
- [ ] 推荐计划（Referral Program）
- [ ] 限时优惠
- [ ] 客户成功团队介入

### 3. 高级分析
- [ ] 用户行为漏斗
- [ ] 套餐升降级分析
- [ ] 收入预测

---

## 📞 技术支持

遇到问题？查看以下资源：
- 📖 Shopify Billing API 文档
- 💬 开发者社区
- 🐛 GitHub Issues


