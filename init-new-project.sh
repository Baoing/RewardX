#!/bin/bash

# 📦 Shopify App Starter - 新项目初始化脚本
# 该脚本帮助你基于 Shopify App Starter 快速创建一个新项目

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# 欢迎信息
clear
print_header "🚀 Shopify App Starter - 新项目初始化"
echo "该脚本将帮助你基于 Shopify App Starter 创建一个新项目"
echo ""

# 确认继续
read -p "是否继续？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_warning "已取消初始化"
  exit 1
fi

# 1. 收集项目信息
print_header "📝 第 1 步：收集项目信息"

read -p "项目名称（如 my-shopify-app）: " PROJECT_NAME
read -p "应用显示名称（如 My Shopify App）: " APP_DISPLAY_NAME
read -p "作者名称: " AUTHOR_NAME
read -p "作者邮箱: " AUTHOR_EMAIL
read -p "应用描述（可选）: " APP_DESCRIPTION

# 设置默认值
APP_DESCRIPTION=${APP_DESCRIPTION:-"A Shopify app built with React Router"}

print_success "项目信息收集完成"
echo ""
echo "项目名称: $PROJECT_NAME"
echo "应用显示名称: $APP_DISPLAY_NAME"
echo "作者: $AUTHOR_NAME <$AUTHOR_EMAIL>"
echo "描述: $APP_DESCRIPTION"
echo ""

read -p "信息是否正确？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_warning "已取消初始化"
  exit 1
fi

# 2. 清理开发数据
print_header "🧹 第 2 步：清理开发数据"

print_info "删除数据库文件..."
rm -f prisma/dev.sqlite
rm -f prisma/dev.sqlite-journal
print_success "数据库文件已删除"

print_info "删除依赖..."
rm -rf node_modules
rm -f package-lock.json
print_success "依赖已删除"

print_info "删除构建产物..."
rm -rf build
rm -rf .react-router
rm -rf dist
rm -rf .cache
print_success "构建产物已删除"

print_info "删除系统文件..."
find . -name ".DS_Store" -delete
print_success "系统文件已删除"

# 3. 更新配置文件
print_header "📝 第 3 步：更新配置文件"

# 更新 package.json
print_info "更新 package.json..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/\"name\": \"smart-seo\"/\"name\": \"$PROJECT_NAME\"/" package.json
  sed -i '' "s/\"author\": \"a333\"/\"author\": \"$AUTHOR_NAME\"/" package.json
else
  # Linux
  sed -i "s/\"name\": \"smart-seo\"/\"name\": \"$PROJECT_NAME\"/" package.json
  sed -i "s/\"author\": \"a333\"/\"author\": \"$AUTHOR_NAME\"/" package.json
fi
print_success "package.json 已更新"

# 更新 shopify.app.toml
print_info "更新 shopify.app.toml..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/name = \"SmartSEO\"/name = \"$APP_DISPLAY_NAME\"/" shopify.app.toml
  sed -i '' '/^client_id = /d' shopify.app.toml
  sed -i '' '/^application_url = /d' shopify.app.toml
  sed -i '' '/redirect_urls = /d' shopify.app.toml
else
  # Linux
  sed -i "s/name = \"SmartSEO\"/name = \"$APP_DISPLAY_NAME\"/" shopify.app.toml
  sed -i '/^client_id = /d' shopify.app.toml
  sed -i '/^application_url = /d' shopify.app.toml
  sed -i '/redirect_urls = /d' shopify.app.toml
fi
print_success "shopify.app.toml 已更新"

# 更新 app/config/app.config.ts
print_info "更新 app/config/app.config.ts..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/name: getEnvVar(\"APP_NAME\", \"Smart SEO\")/name: getEnvVar(\"APP_NAME\", \"$APP_DISPLAY_NAME\")/" app/config/app.config.ts
  sed -i '' "s/description: \"Shopify SEO 优化应用\"/description: \"$APP_DESCRIPTION\"/" app/config/app.config.ts
  sed -i '' "s/name: getEnvVar(\"APP_AUTHOR_NAME\", \"a333\")/name: getEnvVar(\"APP_AUTHOR_NAME\", \"$AUTHOR_NAME\")/" app/config/app.config.ts
  sed -i '' "s/email: getEnvVar(\"APP_AUTHOR_EMAIL\", \"support@smartseo.com\")/email: getEnvVar(\"APP_AUTHOR_EMAIL\", \"$AUTHOR_EMAIL\")/" app/config/app.config.ts
else
  # Linux
  sed -i "s/name: getEnvVar(\"APP_NAME\", \"Smart SEO\")/name: getEnvVar(\"APP_NAME\", \"$APP_DISPLAY_NAME\")/" app/config/app.config.ts
  sed -i "s/description: \"Shopify SEO 优化应用\"/description: \"$APP_DESCRIPTION\"/" app/config/app.config.ts
  sed -i "s/name: getEnvVar(\"APP_AUTHOR_NAME\", \"a333\")/name: getEnvVar(\"APP_AUTHOR_NAME\", \"$AUTHOR_NAME\")/" app/config/app.config.ts
  sed -i "s/email: getEnvVar(\"APP_AUTHOR_EMAIL\", \"support@smartseo.com\")/email: getEnvVar(\"APP_AUTHOR_EMAIL\", \"$AUTHOR_EMAIL\")/" app/config/app.config.ts
fi
print_success "app/config/app.config.ts 已更新"

# 4. 创建 .env 文件
print_header "🔧 第 4 步：创建 .env 文件"

cat > .env << EOF
# Shopify 配置（运行 shopify app dev 后会自动填充）
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=

# 数据库配置
DATABASE_URL=file:./dev.sqlite

# 应用配置
APP_NAME=$APP_DISPLAY_NAME
APP_VERSION=1.0.0
APP_AUTHOR_NAME=$AUTHOR_NAME
APP_AUTHOR_EMAIL=$AUTHOR_EMAIL
APP_ENV=development

# 默认语言
VITE_DEFAULT_LANG=en

# 功能开关
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_MULTI_LANGUAGE=true
VITE_DEBUG_MODE=false

# 第三方服务（可选）
VITE_INTERCOM_APP_ID=
VITE_GA_TRACKING_ID=
VITE_SENTRY_DSN=
EOF

print_success ".env 文件已创建"

# 5. 删除基座相关文档
print_header "🗑️  第 5 步：清理基座文档"

print_info "删除基座相关文档..."
rm -f APP_EMBED_GUIDE.md
rm -f DEPLOY_EXTENSION.md
rm -f DEV_MODE_GUIDE.md
rm -f REINSTALL_APP.md
rm -f SUBSCRIPTION_SYSTEM.md
rm -f SUBSCRIPTION_SYSTEM_SUMMARY.md
rm -f SUBSCRIPTION_OPTIMIZATION.md
rm -f PERMISSION_USAGE_EXAMPLES.md
rm -f THEME_EXTENSION_SUMMARY.md
rm -f TROUBLESHOOTING_404.md

print_info "删除示例文件..."
rm -rf app/examples

print_success "基座文档已清理"

# 6. 创建新的 README
print_header "📖 第 6 步：创建新的 README"

cat > README.md << EOF
# $APP_DISPLAY_NAME

$APP_DESCRIPTION

## 技术栈

- **框架**: React Router v7 (Remix)
- **UI 库**: Shopify Polaris
- **状态管理**: MobX
- **数据库**: Prisma + SQLite
- **国际化**: react-i18next
- **样式**: Tailwind CSS
- **类型**: TypeScript

## 快速开始

### 前置要求

1. Node.js >= 20.0.0
2. Shopify Partner Account
3. 测试店铺
4. Shopify CLI

### 安装

\`\`\`bash
# 安装依赖
npm install

# 初始化数据库
npm run setup

# 启动开发
npm run dev
\`\`\`

### 开发

\`\`\`bash
# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck

# Lint
npm run lint

# 数据库迁移
npm run db:migrate

# 部署 Extension
npm run deploy
\`\`\`

## 项目结构

\`\`\`
app/
├── routes/                 # 路由文件
├── components/            # 可复用组件
├── stores/                # MobX 状态管理
├── hooks/                 # 自定义 Hooks
├── utils/                 # 工具函数
├── services/              # 业务逻辑服务
├── config/                # 配置文件
└── i18n/                  # 国际化
\`\`\`

## 功能特性

- ✅ 用户认证和会话管理
- ✅ 订阅系统（含配额管理）
- ✅ 权限系统（基于套餐的功能控制）
- ✅ 多语言支持
- ✅ Toast 通知系统
- ✅ MobX 状态管理
- ✅ Theme Extension 支持

## 文档

详细文档请查看 \`docs/\` 目录。

## 作者

$AUTHOR_NAME <$AUTHOR_EMAIL>

## 许可证

MIT
EOF

print_success "README.md 已创建"

# 7. 安装依赖
print_header "📦 第 7 步：安装依赖"

print_info "安装 npm 依赖..."
npm install
print_success "依赖安装完成"

# 8. 初始化数据库
print_header "🗄️  第 8 步：初始化数据库"

print_info "生成 Prisma Client..."
npx prisma generate
print_success "Prisma Client 生成完成"

print_info "运行数据库迁移..."
npx prisma migrate dev --name init
print_success "数据库迁移完成"

# 9. 初始化 Git
print_header "📦 第 9 步：初始化 Git 仓库"

if [ -d ".git" ]; then
  print_warning "Git 仓库已存在，跳过初始化"
else
  print_info "初始化 Git 仓库..."
  git init
  print_success "Git 仓库初始化完成"
fi

print_info "添加文件到 Git..."
git add .
git commit -m "feat: 初始化项目 $PROJECT_NAME" || print_warning "没有需要提交的更改"
print_success "文件已提交"

# 10. 完成
print_header "🎉 初始化完成！"

echo ""
print_success "项目初始化成功！"
echo ""
print_info "接下来的步骤："
echo ""
echo "1. 运行 'npm run dev' 启动开发服务器"
echo "2. 按 P 键打开应用 URL 并安装到测试店铺"
echo "3. 开始开发你的应用！"
echo ""
print_info "需要帮助？查看文档："
echo "  - docs/CREATE_NEW_PROJECT.md"
echo "  - https://shopify.dev/docs/apps"
echo ""
print_success "祝你开发顺利！ 🚀"
echo ""

