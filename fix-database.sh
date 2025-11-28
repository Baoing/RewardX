#!/bin/bash

# RewardX 数据库快速修复脚本
# 用于快速修复所有列缺失问题
# 使用方法: ./fix-database.sh

set -e  # 遇到错误立即退出

echo "🔧 RewardX 数据库快速修复"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "⚠️  此脚本将直接修改数据库，确保 schema 与代码同步"
echo "适用于：列缺失、类型不匹配等 schema 不同步问题"
echo ""
read -p "是否继续? (Y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${RED}❌ 已取消${NC}"
    exit 0
fi

echo ""
echo "🚀 步骤 1/2: 同步数据库 schema..."
echo "注意: 这可能会删除 schema 中不存在的列（如 requireEmail, emailVerified, email）"
echo ""

if npx prisma db push --accept-data-loss; then
    echo -e "${GREEN}✅ 数据库 schema 已同步${NC}"
    echo ""
    echo "💡 提示: 如果看到删除列的警告，这是正常的"
    echo "   这些列在旧版本中存在，但新版本 schema 中已移除"
else
    echo -e "${RED}❌ 同步失败，请检查错误信息${NC}"
    exit 1
fi
echo ""

echo "🔧 步骤 2/2: 生成 Prisma Client..."
if npx prisma generate; then
    echo -e "${GREEN}✅ Prisma Client 已生成${NC}"
else
    echo -e "${RED}❌ Prisma Client 生成失败${NC}"
    exit 1
fi
echo ""

echo "======================================"
echo -e "${GREEN}🎉 数据库修复完成！${NC}"
echo ""
echo "💡 提示："
echo "  - 如果仍有问题，运行: npm run db:sync"
echo "  - 查看数据库: npm run db:studio"
echo ""

