#!/bin/bash

# RewardX 快速部署脚本
# 使用方法: bash scripts/deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署 RewardX..."

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请先创建 .env 文件并配置必要的环境变量"
    exit 1
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    exit 1
fi

echo "✅ 环境检查通过"

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 构建镜像
echo "🔨 构建应用镜像..."
docker-compose build app

# 启动数据库
echo "🗄️  启动数据库..."
docker-compose up -d postgres

# 等待数据库就绪
echo "⏳ 等待数据库就绪..."
sleep 10

# 运行数据库迁移
echo "📊 运行数据库迁移..."
docker-compose run --rm app npm run setup

# 启动所有服务
echo "🚀 启动所有服务..."
docker-compose up -d

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 5

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 下一步："
echo "1. 配置 Nginx 反向代理（参考 docs/DEPLOYMENT.md）"
echo "2. 配置 SSL 证书（生产环境）"
echo "3. 更新 Shopify App URL 为服务器地址"
echo ""
echo "🔍 查看日志: docker-compose logs -f app"
echo "🌐 应用地址: http://localhost:3000"

