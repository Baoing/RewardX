#!/bin/bash

# RewardX 数据库初始化脚本
# 此脚本会自动完成数据库初始化的所有步骤

set -e  # 遇到错误立即退出

echo "🎰 RewardX 数据库初始化"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 步骤 1: 检查 .env 文件
echo "📋 步骤 1/6: 检查 .env 配置..."
if grep -q "DATABASE_URL=file:./dev.sqlite" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  警告: .env 文件仍在使用 SQLite${NC}"
    echo ""
    echo "请手动修改 .env 文件："
    echo "找到: DATABASE_URL=file:./dev.sqlite"
    echo '改为: DATABASE_URL="postgresql://rewardx:rewardx_password@localhost:5432/rewardx?schema=public"'
    echo ""
    read -p "修改完成后按 Enter 继续..."
fi

# 验证 PostgreSQL 配置
if grep -q "postgresql://" .env 2>/dev/null; then
    echo -e "${GREEN}✅ .env 配置正确${NC}"
else
    echo -e "${RED}❌ 错误: .env 文件未正确配置${NC}"
    exit 1
fi
echo ""

# 步骤 2: 检查 Docker
echo "🐳 步骤 2/6: 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo "请安装 Docker Desktop: https://docs.docker.com/desktop/install/mac-install/"
    exit 1
fi
echo -e "${GREEN}✅ Docker 已安装${NC}"
echo ""

# 步骤 3: 启动 PostgreSQL
echo "🚀 步骤 3/6: 启动 PostgreSQL..."
if docker compose ps postgres | grep -q "Up"; then
    echo -e "${GREEN}✅ PostgreSQL 已在运行${NC}"
else
    echo "启动 PostgreSQL 容器..."
    docker compose up -d postgres
    
    echo "等待 PostgreSQL 启动..."
    sleep 5
    
    # 等待数据库就绪
    for i in {1..30}; do
        if docker compose exec -T postgres pg_isready -U rewardx &> /dev/null; then
            echo -e "${GREEN}✅ PostgreSQL 已就绪${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ PostgreSQL 启动超时${NC}"
            exit 1
        fi
        echo -n "."
        sleep 1
    done
fi
echo ""

# 步骤 4: 删除旧的 SQLite 迁移
echo "🗑️  步骤 4/6: 清理旧的迁移文件..."
if [ -d "prisma/migrations" ]; then
    rm -rf prisma/migrations
    echo -e "${GREEN}✅ 已删除旧的 SQLite 迁移${NC}"
else
    echo "无需清理"
fi

if [ -f "prisma/dev.sqlite" ]; then
    rm -f prisma/dev.sqlite
    echo -e "${GREEN}✅ 已删除 SQLite 数据库文件${NC}"
fi

if [ -f "dev.sqlite" ]; then
    rm -f dev.sqlite
    echo -e "${GREEN}✅ 已删除 SQLite 数据库文件${NC}"
fi
echo ""

# 步骤 5: 生成 PostgreSQL 迁移
echo "📊 步骤 5/6: 生成数据库迁移..."
npx prisma migrate dev --name init_rewardx_lottery

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库迁移已生成并应用${NC}"
else
    echo -e "${RED}❌ 迁移失败${NC}"
    echo "尝试强制推送..."
    npx prisma db push --accept-data-loss
fi
echo ""

# 步骤 6: 生成 Prisma Client
echo "🔧 步骤 6/6: 生成 Prisma Client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client 已生成${NC}"
else
    echo -e "${RED}❌ Prisma Client 生成失败${NC}"
    exit 1
fi
echo ""

# 完成
echo "======================================"
echo -e "${GREEN}🎉 数据库初始化完成！${NC}"
echo ""
echo "📊 数据库信息："
echo "  - 主机: localhost:5432"
echo "  - 数据库: rewardx"
echo "  - 用户: rewardx"
echo ""
echo "🛠️  可用命令："
echo "  - npx prisma studio     # 打开数据库管理界面"
echo "  - npm run dev           # 启动开发服务器"
echo "  - docker compose logs -f postgres  # 查看数据库日志"
echo ""
echo "📚 查看完整文档："
echo "  - DATABASE_INIT_GUIDE.md"
echo "  - docs/API_DOCUMENTATION.md"
echo ""

