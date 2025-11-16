# RewardX 快速开始指南

## 📋 准备工作

### 1. 安装 Docker Desktop

PostgreSQL 需要 Docker 运行。请根据你的系统下载安装：

- **macOS**: https://docs.docker.com/desktop/install/mac-install/
- **Windows**: https://docs.docker.com/desktop/install/windows-install/
- **Linux**: https://docs.docker.com/desktop/install/linux-install/

安装后，启动 Docker Desktop 并确保它在运行。

验证安装：
```bash
docker --version
# 应该显示类似：Docker version 24.0.7, build afdd53b
```

---

## 🚀 快速开始（5 分钟）

### 步骤 1: 更新环境变量

编辑项目根目录的 `.env` 文件，将数据库配置改为：

```bash
# 找到这一行
DATABASE_URL=file:./dev.sqlite

# 改为
DATABASE_URL="postgresql://rewardx:rewardx_password@localhost:5432/rewardx?schema=public"
```

### 步骤 2: 启动数据库

```bash
# 启动 PostgreSQL 数据库
docker compose up -d postgres

# 查看状态（应显示 running）
docker compose ps
```

### 步骤 3: 生成数据库迁移

```bash
# 安装依赖（如果还没安装）
npm install

# 生成数据库表结构
npx prisma migrate dev --name init_postgresql

# 生成 Prisma Client
npx prisma generate
```

### 步骤 4: 启动应用

```bash
npm run dev
```

访问：http://localhost:3000

---

## 📦 数据库管理

### 查看数据库内容

使用 Prisma Studio（可视化工具）：

```bash
npx prisma studio
```

浏览器会自动打开：http://localhost:5555

### 使用 pgAdmin（可选）

启动 pgAdmin：

```bash
docker compose up -d pgadmin
```

访问：http://localhost:5050

登录信息：
- 邮箱：`admin@rewardx.com`
- 密码：`admin`

添加服务器：
- Host：`postgres`
- Port：`5432`
- Database：`rewardx`
- Username：`rewardx`
- Password：`rewardx_password`

---

## 🛠 常用命令

### Docker 命令

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 查看运行状态
docker compose ps

# 查看数据库日志
docker compose logs -f postgres

# 重启数据库
docker compose restart postgres

# 完全清理（删除数据）
docker compose down -v
```

### Prisma 命令

```bash
# 查看数据库状态
npx prisma db push

# 打开可视化管理工具
npx prisma studio

# 重置数据库（清空所有数据）
npx prisma migrate reset

# 查看迁移状态
npx prisma migrate status

# 生成新迁移
npx prisma migrate dev --name your_migration_name
```

---

## 📊 数据库架构

### 核心功能表

#### 1. **用户系统**
- `User` - 商家用户信息
- `Session` - Shopify 会话管理
- `SetupGuide` - 新手引导进度

#### 2. **订阅系统**
- `Subscription` - 订阅记录
- `Payment` - 支付记录
- `Discount` - 折扣管理
- `UsageRecord` - 使用量统计

#### 3. **抽奖系统** ⭐
- `Campaign` - 抽奖活动配置
- `Prize` - 奖品设置
- `LotteryEntry` - 抽奖记录
- `AnalyticsSnapshot` - 统计快照
- `AnalyticsEvent` - 事件追踪

### 数据库关系图

```
User (商家)
  ├─ SetupGuide (1:1)
  ├─ Subscription (1:N)
  ├─ Campaign (1:N) - 抽奖活动
  │    ├─ Prize (1:N) - 奖品
  │    ├─ LotteryEntry (1:N) - 抽奖记录
  │    └─ AnalyticsSnapshot (1:N) - 统计
  └─ Payment (1:N)
```

---

## 🎯 抽奖功能说明

### 支持的抽奖类型

1. **Lucky Wheel**（大转盘） - 经典转盘抽奖
2. **Slot Machine**（老虎机） - 趣味老虎机
3. **Scratch Card**（刮刮卡） - 刮刮乐
4. **9-box**（九宫格） - 九宫格翻牌

### 两种抽奖场景

#### 场景 1: 下单前抽奖（Pre-Order）
- ✅ 收集邮箱订阅
- ✅ 提升转化率
- ✅ 增加客单价
- 奖励：折扣码、赠品、免运费、再抽一次

#### 场景 2: 下单后抽奖（Post-Order）
- ✅ 提高复购率
- ✅ 社交裂变传播
- ✅ 增强客户粘性
- 基于订单号，每单只能抽一次

### 数据统计

系统自动追踪：
- 📊 PV / UV
- 📊 抽奖次数
- 📊 邮件收集量
- 📊 转化率
- 📊 奖项发放统计
- 📊 订单带动率

---

## 🔧 开发建议

### 环境变量配置

```bash
# .env 文件配置示例

# Shopify 配置
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret

# 数据库（PostgreSQL）
DATABASE_URL="postgresql://rewardx:rewardx_password@localhost:5432/rewardx?schema=public"

# 应用配置
APP_NAME="RewardX – Spin, Win & Repeat"
APP_VERSION=1.0.0
VITE_DEFAULT_LANG=en

# 功能开关
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG_MODE=true
```

### 开发时的最佳实践

1. **使用 Prisma Studio 查看数据**
   ```bash
   npx prisma studio
   ```

2. **开启查询日志**
   ```typescript
   // app/db.server.ts
   const prisma = new PrismaClient({
     log: ["query", "error", "warn"]
   })
   ```

3. **定期备份数据**
   ```bash
   docker exec rewardx-postgres pg_dump -U rewardx rewardx > backup.sql
   ```

---

## ❌ 常见问题

### Q1: Docker 启动失败

**错误**：`Cannot connect to the Docker daemon`

**解决**：
1. 确保 Docker Desktop 正在运行
2. 重启 Docker Desktop
3. 检查 Docker 状态：`docker ps`

### Q2: 端口被占用

**错误**：`port 5432 is already allocated`

**解决**：
```bash
# 查找占用端口的进程
lsof -i :5432

# 停止其他 PostgreSQL 服务
brew services stop postgresql  # macOS
```

或修改 `docker-compose.yml` 中的端口：
```yaml
ports:
  - "5433:5432"  # 改为 5433
```

然后更新 `.env` 中的 `DATABASE_URL` 端口。

### Q3: 迁移失败

**错误**：`Migration failed`

**解决**：
```bash
# 方法 1: 重置数据库（清空数据）
npx prisma migrate reset

# 方法 2: 强制推送（开发环境）
npx prisma db push --force-reset

# 方法 3: 删除迁移重新生成
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

### Q4: Prisma Client 类型错误

**错误**：`Type 'Campaign' does not exist`

**解决**：
```bash
# 重新生成 Prisma Client
npx prisma generate
```

---

## 📚 相关文档

- [数据库详细配置](./DATABASE_SETUP.md) - PostgreSQL 详细配置指南
- [项目主 README](../README.md) - 项目总体说明
- [订阅系统](../SUBSCRIPTION_SYSTEM.md) - 订阅功能文档
- [Prisma 文档](https://www.prisma.io/docs) - Prisma ORM 官方文档

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看日志：`docker compose logs -f postgres`
2. 检查数据库状态：`npx prisma migrate status`
3. 查看项目 GitHub Issues
4. 联系开发团队

---

## ✅ 下一步

完成上述步骤后，你可以：

1. 🎨 开发第一个抽奖活动界面
2. 📊 配置数据统计看板
3. 🎁 设置奖品规则
4. 🚀 部署到生产环境

祝开发顺利！🎉

