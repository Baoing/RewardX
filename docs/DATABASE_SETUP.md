# PostgreSQL 数据库配置指南

## 快速开始

### 1. 更新 .env 文件

将 `.env` 文件中的数据库配置修改为：

```bash
# 数据库配置 - PostgreSQL
DATABASE_URL="postgresql://rewardx:rewardx_password@localhost:5432/rewardx?schema=public"
```

### 2. 启动本地 PostgreSQL

使用 Docker Compose 启动本地 PostgreSQL：

```bash
# 启动数据库
docker-compose up -d postgres

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f postgres
```

### 3. 生成数据库迁移

删除旧的 SQLite 迁移文件并生成新的 PostgreSQL 迁移：

```bash
# 删除旧迁移（重要！）
rm -rf prisma/migrations

# 生成新迁移
npx prisma migrate dev --name init_postgresql

# 生成 Prisma Client
npx prisma generate
```

### 4. 验证数据库连接

```bash
# 查看数据库状态
npx prisma db push

# 打开 Prisma Studio
npx prisma studio
```

---

## Docker Compose 命令

### 基本命令

```bash
# 启动所有服务
docker-compose up -d

# 仅启动 PostgreSQL
docker-compose up -d postgres

# 停止服务
docker-compose down

# 停止并删除数据卷（清空所有数据）
docker-compose down -v

# 重启服务
docker-compose restart postgres

# 查看日志
docker-compose logs -f postgres
```

### 进入数据库容器

```bash
# 进入 PostgreSQL 容器
docker exec -it rewardx-postgres psql -U rewardx -d rewardx

# 在容器内执行 SQL
docker exec rewardx-postgres psql -U rewardx -d rewardx -c "SELECT * FROM \"User\";"
```

---

## pgAdmin 数据库管理工具

Docker Compose 已包含 pgAdmin，可通过浏览器管理数据库。

### 访问 pgAdmin

1. 启动服务：
```bash
docker-compose up -d pgadmin
```

2. 浏览器访问：http://localhost:5050

3. 登录信息：
   - 邮箱：`admin@rewardx.com`
   - 密码：`admin`

4. 添加服务器连接：
   - 名称：RewardX
   - Host：`postgres`（容器内网络）
   - Port：`5432`
   - 数据库：`rewardx`
   - 用户名：`rewardx`
   - 密码：`rewardx_password`

---

## 数据库架构说明

### 核心表结构

#### 1. **User**（用户表）
存储 Shopify 商家信息，包括店铺信息、订阅状态、APP 评价等。

#### 2. **SetupGuide**（新手引导）
记录用户完成新手任务的进度。

```typescript
// 示例响应
{
  tasks: [
    {id: 2, is_completed: true},
    {id: 4, is_completed: true},
    {id: 8, is_completed: false},
    {id: 16, is_completed: false}
  ],
  completedTasks: 2,
  totalTasks: 4,
  isCompleted: false
}
```

#### 3. **Campaign**（抽奖活动）
管理抽奖活动的配置，支持：
- **抽奖类型**：大转盘、老虎机、刮刮卡、九宫格
- **触发场景**：下单前、下单后
- **页面配置**：首页、产品页、购物车等

#### 4. **Prize**（奖品配置）
配置抽奖奖品：
- **奖品类型**：折扣码、赠品、免运费、再抽一次
- **权重系统**：控制中奖概率
- **库存管理**：限制奖品数量

#### 5. **LotteryEntry**（抽奖记录）
记录每次抽奖：
- 参与信息（邮箱、订单号）
- 中奖结果
- 转化追踪
- 分享数据

#### 6. **AnalyticsSnapshot**（统计快照）
按天/小时聚合统计数据：
- 访问量、参与量
- 中奖率、转化率
- 邮件收集、收入统计

---

## 生产环境部署

### 推荐服务商

#### 1. **Supabase**（最推荐）
- ✅ 免费额度：500MB 数据库
- ✅ 自动备份、实时功能
- ✅ 内置认证和存储
- 📝 获取连接字符串：https://app.supabase.com

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

#### 2. **Railway**（性价比高）
- ✅ 简单易用
- ✅ 按使用量计费
- 📝 官网：https://railway.app

#### 3. **Neon**（Serverless）
- ✅ Serverless PostgreSQL
- ✅ 自动扩缩容
- 📝 官网：https://neon.tech

#### 4. **Heroku Postgres**
- ✅ 简单可靠
- ❌ 价格较高
- 📝 官网：https://www.heroku.com/postgres

### 环境变量配置

生产环境的 `.env` 配置示例：

```bash
# 生产环境数据库
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"

# 连接池（推荐）
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require&connection_limit=10&pool_timeout=30"
```

---

## 数据库性能优化

### 1. 索引已优化

Schema 中已添加重要索引：

```prisma
// Campaign 索引
@@index([userId, status])
@@index([triggerType, status])

// LotteryEntry 索引
@@index([campaignId, createdAt])
@@index([email])
@@index([orderId])
@@index([isWinner, status])
```

### 2. 连接池配置

生产环境建议配置连接池：

```bash
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=30"
```

### 3. 查询优化示例

```typescript
// ✅ 使用 select 只查询需要的字段
const campaigns = await prisma.campaign.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    totalEntries: true
  },
  where: { userId, status: "active" }
})

// ✅ 使用 include 预加载关联数据
const campaign = await prisma.campaign.findUnique({
  where: { id },
  include: {
    prizes: true,
    _count: {
      select: { lotteryEntries: true }
    }
  }
})
```

---

## 常见问题

### Q: 数据库迁移失败怎么办？

```bash
# 1. 重置数据库（会清空所有数据）
npx prisma migrate reset

# 2. 强制推送 schema（开发环境）
npx prisma db push --force-reset

# 3. 查看迁移状态
npx prisma migrate status
```

### Q: 如何备份数据库？

```bash
# Docker 环境备份
docker exec rewardx-postgres pg_dump -U rewardx rewardx > backup.sql

# 恢复备份
docker exec -i rewardx-postgres psql -U rewardx rewardx < backup.sql
```

### Q: 如何切换回 SQLite？

1. 修改 `prisma/schema.prisma`：
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.sqlite"
}
```

2. 删除迁移并重新生成：
```bash
rm -rf prisma/migrations
npx prisma migrate dev --name init_sqlite
```

---

## 监控和日志

### 查看 PostgreSQL 日志

```bash
# 实时查看日志
docker-compose logs -f postgres

# 查看最近 100 行
docker-compose logs --tail=100 postgres
```

### Prisma Query 日志

在代码中启用查询日志：

```typescript
// app/db.server.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" 
    ? ["query", "error", "warn"] 
    : ["error"]
})
```

---

## 下一步

1. ✅ 启动 PostgreSQL：`docker-compose up -d postgres`
2. ✅ 更新 .env 文件
3. ✅ 生成数据库迁移：`npx prisma migrate dev`
4. ✅ 启动应用：`npm run dev`

如有问题，请查看项目 README 或联系开发团队。

