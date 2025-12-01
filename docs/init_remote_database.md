# 远程 PostgreSQL 数据库初始化指南

## 数据库连接信息
- **IP**: 194.41.36.92
- **数据库名**: Rewardx
- **用户名**: Rewardx
- **密码**: cZBtbCrGZyeF
- **端口**: 5432 (默认)

## 问题
当前用户 `Rewardx` 没有在 `public` schema 上创建表的权限。

## 解决方案

### 方案 1: 授予用户权限（推荐）

在数据库服务器上，使用超级用户（如 postgres）执行以下 SQL：

```sql
-- 连接到数据库
\c Rewardx

-- 授予用户 Rewardx 在 public schema 上的所有权限
GRANT ALL PRIVILEGES ON SCHEMA public TO "Rewardx";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "Rewardx";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "Rewardx";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "Rewardx";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "Rewardx";
```

### 方案 2: 使用超级用户执行 SQL 脚本

1. 使用超级用户连接到数据库
2. 执行 `init_database.sql` 脚本

```bash
# 在服务器上执行
psql -h 194.41.36.92 -U postgres -d Rewardx -f init_database.sql
```

## 初始化步骤

### 步骤 1: 授予权限（如果使用方案 1）

```bash
# 在服务器上使用超级用户连接
psql -h 194.41.36.92 -U postgres -d Rewardx

# 执行权限授予命令（见上方）
```

### 步骤 2: 运行 Prisma 迁移

在本地项目目录执行：

```bash
# 确保 DATABASE_URL 已更新
cat .env | grep DATABASE_URL

# 运行迁移
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate
```

### 步骤 3: 验证连接

```bash
# 检查迁移状态
npx prisma migrate status

# 打开 Prisma Studio 查看数据
npx prisma studio
```

## 当前 DATABASE_URL

已更新为：
```
DATABASE_URL="postgresql://Rewardx:cZBtbCrGZyeF@194.41.36.92:5432/Rewardx?schema=public"
```

## 备份

原始 `.env` 文件已备份为 `.env.backup`

