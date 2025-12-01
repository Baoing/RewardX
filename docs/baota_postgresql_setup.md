# 宝塔面板 PostgreSQL 权限设置指南

## 问题说明
当前用户 `Rewardx` 没有在 `public` schema 上创建表的权限，需要授予相应权限。

## 宝塔面板操作步骤

### 方法 1: 使用宝塔面板的 PostgreSQL 管理工具

1. **登录宝塔面板**
   - 进入宝塔面板后台

2. **打开 PostgreSQL 管理**
   - 点击左侧菜单 "数据库" → "PostgreSQL 管理"
   - 或者 "软件商店" → 找到 PostgreSQL → "管理"

3. **使用超级用户 postgres 登录**
   - 在 PostgreSQL 管理界面，使用以下凭据：
     - **用户名**: `postgres`
     - **密码**: 宝塔面板安装 PostgreSQL 时设置的 postgres 用户密码
     - （如果忘记密码，可以在宝塔面板的 PostgreSQL 设置中重置）

4. **执行 SQL 命令**
   - 在 SQL 执行界面，选择数据库 `Rewardx`
   - 执行以下 SQL 命令：

```sql
-- 授予 Rewardx 用户在 public schema 上的所有权限
GRANT ALL PRIVILEGES ON SCHEMA public TO "Rewardx";

-- 授予现有表的权限（如果有）
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "Rewardx";

-- 授予序列的权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "Rewardx";

-- 设置默认权限（未来创建的表和序列）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "Rewardx";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "Rewardx";

-- 确保用户可以创建表
ALTER USER "Rewardx" WITH CREATEDB;
```

### 方法 2: 使用 SSH 命令行（如果宝塔面板没有 SQL 执行界面）

1. **SSH 连接到服务器**
   ```bash
   ssh root@194.41.36.92
   ```

2. **切换到 postgres 用户**
   ```bash
   su - postgres
   ```

3. **连接到 PostgreSQL**
   ```bash
   psql -d Rewardx
   ```

4. **执行权限授予命令**
   ```sql
   GRANT ALL PRIVILEGES ON SCHEMA public TO "Rewardx";
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "Rewardx";
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "Rewardx";
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "Rewardx";
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "Rewardx";
   ALTER USER "Rewardx" WITH CREATEDB;
   ```

5. **退出**
   ```sql
   \q
   ```

### 方法 3: 使用 pgAdmin 或其他 PostgreSQL 客户端

1. **连接信息**
   - 主机: 194.41.36.92
   - 端口: 5432
   - 数据库: Rewardx
   - 用户名: postgres（超级用户）
   - 密码: 宝塔面板设置的 postgres 密码

2. **执行 SQL**
   - 使用 Query Tool 执行上述权限授予命令

## 验证权限

执行权限授予后，可以验证：

```sql
-- 查看用户权限
\du "Rewardx"

-- 查看 schema 权限
\dn+

-- 测试创建表（使用 Rewardx 用户）
-- 切换到 Rewardx 用户连接测试
```

## 重要提示

⚠️ **不要将 Rewardx 设置为超级用户（SUPERUSER）**
- 只需要授予在 `public` schema 上的权限即可
- 超级用户权限过大，存在安全风险
- 使用 `GRANT` 命令授予特定权限即可

## 如果忘记 postgres 密码

在宝塔面板中：
1. 进入 PostgreSQL 管理
2. 点击 "修改密码" 或 "重置密码"
3. 重置 postgres 用户的密码

## 完成权限设置后

回到本地项目，执行：

```bash
# 运行迁移
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate

# 验证
npx prisma migrate status
```

