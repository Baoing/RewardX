#!/bin/bash

# 宝塔面板快速部署脚本
# 使用方法: bash scripts/deploy-bt.sh

set -e

echo "🚀 RewardX 宝塔面板部署脚本"
echo "================================"

# 检查是否在宝塔环境
if [ ! -d "/www/wwwroot" ]; then
    echo "⚠️  警告: 未检测到宝塔面板环境"
    echo "请确保在宝塔面板的终端中运行此脚本"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 项目路径
PROJECT_DIR="/www/wwwroot/rewardx"

# 检查 .env 文件
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请先在 $PROJECT_DIR 目录创建 .env 文件"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 进入项目目录
cd "$PROJECT_DIR"

# 1. 安装依赖
echo "📦 安装依赖..."
npm ci --omit=dev

# 2. 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 3. 运行数据库迁移
echo "📊 运行数据库迁移..."
npx prisma migrate deploy || echo "⚠️  数据库迁移失败，请检查数据库配置"

# 4. 构建项目
echo "🔨 构建项目..."
npm run build

# 5. 检查 PM2 是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "📥 安装 PM2..."
    npm install -g pm2
fi

# 6. 停止现有进程（如果存在）
echo "🛑 停止现有进程..."
pm2 stop rewardx 2>/dev/null || true
pm2 delete rewardx 2>/dev/null || true

# 7. 启动应用
echo "🚀 启动应用..."
pm2 start npm --name "rewardx" -- run start

# 8. 保存 PM2 配置
pm2 save

# 9. 设置开机自启
echo "⚙️  配置开机自启..."
pm2 startup | grep -v "PM2" | bash || true

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 下一步："
echo "1. 在宝塔面板配置 Nginx 反向代理（参考 docs/DEPLOY_BT_CLOUDFLARE.md）"
echo "2. 申请 SSL 证书"
echo "3. 配置 Cloudflare DNS 和 SSL"
echo ""
echo "🔍 查看日志: pm2 logs rewardx"
echo "📊 查看状态: pm2 status"
echo "🌐 应用地址: http://localhost:3000"

