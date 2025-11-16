# 📚 Shopify 订阅系统开发指南

## 🚨 重要提示：Billing API 限制

Shopify 的 Billing API **只能在公开发布（Public Distribution）的应用中使用**。

在开发阶段，你会遇到以下错误：
```
Apps without a public distribution cannot use the Billing API
```

这是正常的！我们已经为你配置了开发模式。

---

## 🛠️ 开发模式 vs 生产模式

### 开发模式（当前）

✅ **自动检测**：`process.env.NODE_ENV !== "production"`

**工作流程**：
1. 用户点击订阅按钮
2. 后端直接在数据库创建订阅记录
3. 订阅状态自动设置为 `active`
4. **跳过 Shopify Billing API**
5. 页面刷新，显示新订阅

**优势**：
- ✅ 无需 Shopify 审核
- ✅ 可以立即测试所有功能
- ✅ 不产生真实费用
- ✅ 开发速度快

### 生产模式（未来）

**工作流程**：
1. 用户点击订阅按钮
2. 后端调用 Shopify Billing API
3. 用户跳转到 Shopify 确认页面
4. 用户确认支付
5. Shopify 回调你的应用
6. 订阅激活

**前置条件**：
- ✅ 应用通过 Shopify 审核
- ✅ 应用设置为公开发布
- ✅ 配置了真实的支付方式

---

## 🧪 如何测试订阅功能

### 1. 创建订阅

```bash
# 访问 Billing 页面
http://your-app.com/app/billing

# 点击任意套餐的订阅按钮
# ✅ 开发模式：立即激活，页面刷新
# ⏳ 生产模式：跳转到 Shopify 确认
```

### 2. 查看订阅

```bash
# 数据库查询
cd /Users/a333/WebstormProjects/shopify-app-starter
sqlite3 prisma/dev.sqlite "SELECT * FROM Subscription;"
```

### 3. 测试配额消耗

```typescript
import { consumeQuota, checkQuota } from "./services/subscription.server"

// 检查配额
const { hasQuota, remaining } = await checkQuota(userId)
console.log(`剩余配额: ${remaining}`)

// 消耗配额
await consumeQuota(userId, "test_action", 1)
```

### 4. 手动开通套餐（管理员）

```bash
# 1. 设置管理员密钥
echo "ADMIN_SECRET=$(openssl rand -base64 32)" >> .env

# 2. 调用管理员 API
curl -X POST http://localhost:3000/api/admin/subscriptions \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'action=grant' \
  -d 'shop=your-shop.myshopify.com' \
  -d 'planType=professional' \
  -d 'billingCycle=monthly' \
  -d 'grantedBy=admin@example.com' \
  -d 'grantReason=测试用户'
```

---

## 🚀 发布到生产环境

### 步骤 1: 准备应用审核

1. **完善应用信息**
   - 应用名称、描述
   - Logo 和截图
   - 隐私政策和服务条款
   - 支持邮箱

2. **测试应用功能**
   - 确保所有功能正常
   - 修复所有 bug
   - 优化用户体验

3. **设置 Billing**
   - 在 Shopify Partner Dashboard 配置定价
   - 设置试用期
   - 配置支付方式

### 步骤 2: 提交审核

1. 进入 [Shopify Partner Dashboard](https://partners.shopify.com/)
2. 选择你的应用
3. 点击 "Distribution" → "Public listing"
4. 填写所有必填信息
5. 提交审核

### 步骤 3: 审核通过后

**无需修改代码！**

系统会自动切换：
- ✅ `NODE_ENV=production` 时使用真实 Billing API
- ✅ 其他环境使用开发模式

---

## 📊 当前系统状态

### ✅ 已实现
- [x] 4 档套餐系统
- [x] 月付/年付切换
- [x] 配额管理
- [x] 折扣系统
- [x] 管理员 API
- [x] 分析统计
- [x] **开发模式**（跳过 Billing API）

### 🔄 开发模式特性
- [x] 自动检测环境
- [x] 直接激活订阅
- [x] 无需 Shopify 支付确认
- [x] 支持所有订阅功能
- [x] 数据库完整记录

### 📝 待实现（可选）
- [ ] 配额耗尽提醒
- [ ] 试用期结束通知
- [ ] 升级套餐引导
- [ ] 订阅统计仪表板
- [ ] 发票生成

---

## 🎯 常见问题

### Q1: 为什么不能使用 Billing API？
**A**: Shopify 限制未公开发布的应用使用 Billing API。这是为了防止测试应用产生真实费用。

### Q2: 开发模式安全吗？
**A**: 是的！
- ✅ 只在 `NODE_ENV !== "production"` 时启用
- ✅ 数据存储在你的本地数据库
- ✅ 不产生任何费用
- ✅ 功能完全隔离

### Q3: 如何切换到生产模式？
**A**: 自动切换！
```bash
# 开发环境（自动使用开发模式）
npm run dev

# 生产环境（自动使用 Billing API）
NODE_ENV=production npm start
```

### Q4: 开发模式可以测试所有功能吗？
**A**: 可以！除了真实支付，其他功能完全一致：
- ✅ 订阅创建
- ✅ 配额管理
- ✅ 折扣应用
- ✅ 订阅取消
- ✅ 数据统计

### Q5: 数据会丢失吗？
**A**: 不会！
- ✅ 开发模式数据存储在本地数据库
- ✅ 生产模式数据同样存储在数据库
- ✅ 两种模式使用相同的数据结构

---

## 💡 最佳实践

### 开发阶段
1. ✅ 使用开发模式测试所有订阅流程
2. ✅ 验证配额系统正常工作
3. ✅ 测试折扣码功能
4. ✅ 确保管理员 API 可用

### 上线前
1. ✅ 完成 Shopify 审核
2. ✅ 设置真实定价
3. ✅ 配置支付方式
4. ✅ 测试生产环境

### 上线后
1. ✅ 监控订阅数据
2. ✅ 跟踪用户行为
3. ✅ 分析转化率
4. ✅ 优化定价策略

---

## 🎊 总结

**当前状态**：✅ 订阅系统完全可用（开发模式）

**下一步**：
1. 在开发模式下测试所有功能
2. 集成到你的业务逻辑中
3. 准备应用审核材料
4. 提交 Shopify 审核
5. 审核通过后自动切换到生产模式

**无需担心**：
- ❌ 不会产生费用
- ❌ 不需要真实支付
- ❌ 不影响功能测试
- ✅ 一切都在本地运行

---

**🚀 现在就可以开始测试订阅功能了！**


