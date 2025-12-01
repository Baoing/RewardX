# Vercel 部署故障排查指南

## 🔍 问题诊断

从构建日志看，构建是成功的，但运行时出现 500 错误。可能的原因：

1. **环境变量缺失** - 最常见的原因
2. **数据库连接失败** - Prisma 在 Serverless 环境中的配置问题
3. **Vercel 配置不正确** - React Router preset 未检测到

---

## ✅ 解决方案

### 1. 检查环境变量（最重要）

在 Vercel 项目设置中，确保设置了以下环境变量：

```bash
# Shopify 配置（必需）
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
SCOPES=read_orders,read_customers,write_discounts,write_draft_orders,read_products

# 数据库配置（必需）
DATABASE_URL=postgresql://user:password@host:5432/database
# 或使用 Vercel Postgres
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...

# 会话密钥（必需）
SESSION_SECRET=your_random_secret

# Node 环境
NODE_ENV=production
```

**检查方法：**
1. Vercel Dashboard → 项目 → Settings → Environment Variables
2. 确保所有变量都已设置
3. 确保选择了正确的环境（Production, Preview, Development）

---

### 2. 更新 vercel.json

已更新 `vercel.json`，使用 React Router 的自动检测：

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "react-router",
  "outputDirectory": "build/client"
}
```

**重要：** 不要手动配置 `rewrites` 和 `functions`，React Router v7 会自动处理。

---

### 3. Prisma 在 Serverless 环境中的优化

已更新 `app/db.server.ts`，优化了 Serverless 环境的连接管理。

**如果使用 Vercel Postgres：**

确保在构建时运行迁移：

```json
{
  "scripts": {
    "build": "npx prisma generate && npx prisma migrate deploy && react-router build"
  }
}
```

**或者使用 POSTGRES_URL_NON_POOLING 进行迁移：**

在 Vercel 环境变量中设置：
```bash
DATABASE_URL_MIGRATE=$POSTGRES_URL_NON_POOLING
```

然后修改构建脚本：
```json
{
  "scripts": {
    "build": "npx prisma generate && DATABASE_URL=$DATABASE_URL_MIGRATE npx prisma migrate deploy && react-router build"
  }
}
```

---

### 4. 查看详细错误日志

在 Vercel Dashboard 中：

1. 进入项目 → **Deployments**
2. 点击失败的部署
3. 查看 **Function Logs** 或 **Runtime Logs**
4. 查找具体的错误信息

**常见错误：**

#### 错误 1: 环境变量缺失
```
Error: ❌ 缺少必需的环境变量: SHOPIFY_API_KEY, SHOPIFY_API_SECRET
```
**解决：** 在 Vercel 环境变量中添加缺失的变量

#### 错误 2: 数据库连接失败
```
PrismaClientInitializationError: Can't reach database server
```
**解决：** 
- 检查 `DATABASE_URL` 是否正确
- 如果使用外部数据库，确保允许 Vercel 的 IP 访问
- 如果使用 Vercel Postgres，确保使用 `POSTGRES_PRISMA_URL`

#### 错误 3: Prisma Client 未生成
```
Cannot find module '@prisma/client'
```
**解决：** 确保构建脚本包含 `npx prisma generate`

---

## 🔧 完整部署检查清单

- [ ] 所有必需的环境变量已设置
- [ ] `SHOPIFY_APP_URL` 设置为完整的 HTTPS URL
- [ ] `DATABASE_URL` 或 `POSTGRES_PRISMA_URL` 已配置
- [ ] `SESSION_SECRET` 已设置
- [ ] `vercel.json` 已更新（使用 `framework: "react-router"`）
- [ ] 构建脚本包含 Prisma 生成和迁移
- [ ] 数据库迁移已运行
- [ ] 查看 Vercel 日志确认具体错误

---

## 🚀 快速修复步骤

### 步骤 1: 更新 vercel.json

已自动更新，确保使用：
```json
{
  "framework": "react-router"
}
```

### 步骤 2: 检查环境变量

在 Vercel Dashboard 中验证所有环境变量。

### 步骤 3: 更新构建脚本（如果需要）

如果使用 Vercel Postgres，更新 `package.json`：

```json
{
  "scripts": {
    "build": "npx prisma generate && npx prisma migrate deploy && react-router build"
  }
}
```

### 步骤 4: 重新部署

1. 在 Vercel Dashboard 中，点击 **Redeploy**
2. 或推送新的提交触发自动部署

### 步骤 5: 查看日志

部署后，查看 Function Logs 确认问题是否解决。

---

## 📝 常见问题

### Q: 为什么构建成功但运行时崩溃？

**A:** 通常是运行时错误，最常见的是：
- 环境变量缺失
- 数据库连接失败
- Prisma Client 未生成

### Q: 如何查看详细的错误信息？

**A:** 
1. Vercel Dashboard → Deployments → 失败的部署
2. 查看 **Function Logs** 或 **Runtime Logs**
3. 查找红色错误信息

### Q: Prisma 在 Serverless 环境中需要注意什么？

**A:**
- 使用连接池（Vercel Postgres 自动提供）
- 使用全局变量缓存 Prisma Client 实例
- 确保在构建时生成 Prisma Client
- 使用 `POSTGRES_PRISMA_URL` 而不是 `POSTGRES_URL`

---

## 🎯 下一步

1. 检查 Vercel Dashboard 中的环境变量
2. 查看 Function Logs 获取具体错误
3. 根据错误信息进行修复
4. 重新部署

如果问题仍然存在，请提供 Vercel Function Logs 中的具体错误信息，我可以进一步帮助诊断。

