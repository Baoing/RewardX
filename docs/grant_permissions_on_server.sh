#!/bin/bash
# 在服务器上执行此脚本来授予 Rewardx 用户权限
# 使用方法：在服务器上执行 bash grant_permissions_on_server.sh

# 使用 postgres 用户连接到数据库并执行权限授予
PGPASSWORD='fk6SxahXX87aDxrr' psql -h localhost -U postgres -d Rewardx << EOF

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

-- 验证权限
\du "Rewardx"

EOF

echo "权限授予完成！"

