-- 在宝塔面板 PostgreSQL 管理界面执行此 SQL
-- 使用 postgres 用户登录，选择 Rewardx 数据库

-- 授予 Rewardx 用户在 public schema 上的所有权限
GRANT ALL PRIVILEGES ON SCHEMA public TO "Rewardx";

-- 授予现有表的权限（如果有）
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "Rewardx";

-- 授予序列的权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "Rewardx";

-- 设置默认权限（未来创建的表和序列）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "Rewardx";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "Rewardx";

-- 允许用户创建数据库（可选）
ALTER USER "Rewardx" WITH CREATEDB;

-- 验证权限（可选，查看用户信息）
\du "Rewardx"
