#!/bin/bash

# RewardX 数据库同步脚本
# 用于在新电脑上同步数据库 schema，确保所有迁移都被正确应用
# 使用方法: ./sync-database.sh

set -e  # 遇到错误立即退出

echo "🔄 RewardX 数据库同步"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 步骤 1: 检查 .env 文件
echo "📋 步骤 1/5: 检查 .env 配置..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ 错误: .env 文件不存在${NC}"
    echo "请先创建 .env 文件并配置 DATABASE_URL"
    exit 1
fi

if ! grep -q "postgresql://" .env 2>/dev/null; then
    echo -e "${RED}❌ 错误: .env 文件未正确配置 PostgreSQL${NC}"
    echo "请确保 DATABASE_URL 指向 PostgreSQL 数据库"
    exit 1
fi

echo -e "${GREEN}✅ .env 配置正确${NC}"
echo ""

# 步骤 2: 检查数据库连接
echo "🔌 步骤 2/5: 检查数据库连接..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" &> /dev/null; then
    echo -e "${YELLOW}⚠️  无法连接到数据库，尝试启动 Docker...${NC}"
    if command -v docker &> /dev/null; then
        docker compose up -d postgres
        echo "等待数据库启动..."
        sleep 5
    else
        echo -e "${RED}❌ Docker 未安装，请手动启动数据库${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ 数据库连接正常${NC}"
echo ""

# 步骤 3: 检查迁移状态
echo "📊 步骤 3/5: 检查迁移状态..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    echo -e "${GREEN}✅ 数据库 schema 已是最新${NC}"
else
    echo -e "${YELLOW}⚠️  发现未应用的迁移${NC}"
    echo ""
fi
echo ""

# 步骤 4: 应用所有迁移
echo "🚀 步骤 4/5: 应用数据库迁移..."
echo "这会将所有迁移应用到数据库，确保 schema 与代码同步"
echo ""

# 尝试使用 migrate deploy（生产环境推荐）
if npx prisma migrate deploy 2>&1; then
    echo -e "${GREEN}✅ 迁移已成功应用${NC}"
else
    echo -e "${YELLOW}⚠️  migrate deploy 失败${NC}"
    echo ""
    echo "可能的原因："
    echo "  - 数据库 schema 与迁移文件不同步"
    echo "  - 某些列缺失或类型不匹配"
    echo ""
    echo "解决方案：使用 db push 强制同步（推荐用于开发环境）"
    echo ""
    read -p "是否使用 db push 强制同步? (Y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "正在使用 db push 同步数据库..."
        if npx prisma db push --accept-data-loss 2>&1; then
            echo -e "${GREEN}✅ 数据库 schema 已同步${NC}"
        else
            echo -e "${RED}❌ db push 也失败了，请检查错误信息${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ 已取消，请手动修复数据库问题${NC}"
        exit 1
    fi
fi
echo ""

# 步骤 5: 生成 Prisma Client
echo "🔧 步骤 5/5: 生成 Prisma Client..."
if npx prisma generate; then
    echo -e "${GREEN}✅ Prisma Client 已生成${NC}"
else
    echo -e "${RED}❌ Prisma Client 生成失败${NC}"
    exit 1
fi
echo ""

# 完成
echo "======================================"
echo -e "${GREEN}🎉 数据库同步完成！${NC}"
echo ""
echo "📊 验证数据库状态："
echo "  - 运行: npx prisma migrate status"
echo "  - 查看: npx prisma studio"
echo ""
echo "💡 提示:"
echo "  - 如果仍有列缺失错误，运行: npx prisma db push"
echo "  - 查看迁移历史: ls prisma/migrations/"
echo ""

