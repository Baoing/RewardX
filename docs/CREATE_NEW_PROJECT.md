# 📦 基于 Shopify App Starter 创建新项目指南

本文档说明如何使用 Shopify App Starter 作为基座，快速创建一个新的 Shopify 应用项目。

---

## 🎯 快速开始

### 方法一：使用自动化脚本（推荐）

```bash
# 1. 在项目根目录运行初始化脚本
chmod +x init-new-project.sh
./init-new-project.sh

# 2. 按照提示输入新项目信息
# - 项目名称（如：my-shopify-app）
# - 应用显示名称（如：My Shopify App）
# - 作者名称
# - 作者邮箱

# 3. 脚本会自动：
#   - 清理开发数据
#   - 更新配置文件
#   - 重新初始化 Git
#   - 安装依赖
#   - 初始化数据库
```

### 方法二：手动创建

如果你想更精细地控制创建过程，请按照下面的详细步骤操作。

---

## 📋 详细步骤

### 1️⃣ 复制项目代码

```bash
# 方案 A：克隆仓库后删除 .git
git clone <shopify-app-starter-repo> my-new-app
cd my-new-app
rm -rf .git

# 方案 B：直接下载代码
# 从 GitHub 下载 ZIP，解压到目标目录
```

### 2️⃣ 清理开发数据

```bash
# 删除开发数据库
rm -f prisma/dev.sqlite
rm -f prisma/dev.sqlite-journal

# 删除依赖
rm -rf node_modules
rm -f package-lock.json

# 删除构建产物
rm -rf build
rm -rf .react-router
rm -rf dist

# 删除缓存
rm -rf .cache
rm -rf node_modules/.cache

# 删除系统文件
find . -name ".DS_Store" -delete
```

### 3️⃣ 更新项目配置

#### 📝 package.json

```json
{
  "name": "your-app-name",          // ✏️ 修改项目名称
  "author": "Your Name"              // ✏️ 修改作者
}
```

#### 📝 shopify.app.toml

```toml
# 删除现有配置，重新生成
client_id = ""                      # 🔄 运行 shopify app dev 后自动生成
name = "Your App Name"              # ✏️ 修改应用名称
application_url = ""                # 🔄 运行 shopify app dev 后自动生成

[auth]
redirect_urls = []                  # 🔄 运行 shopify app dev 后自动生成
```

#### 📝 app/config/app.config.ts

```typescript
export const APP_CONFIG = {
  // 应用基本信息
  name: getEnvVar("APP_NAME", "Your App Name"),       // ✏️ 修改应用名称
  version: getEnvVar("APP_VERSION", "1.0.0"),
  description: "Your app description",                 // ✏️ 修改描述
  
  // 应用作者信息
  author: {
    name: getEnvVar("APP_AUTHOR_NAME", "Your Name"),  // ✏️ 修改作者
    email: getEnvVar("APP_AUTHOR_EMAIL", "your@email.com")  // ✏️ 修改邮箱
  },
  
  // ... 其他配置
}
```

#### 📝 extensions/smart-seo-embed/shopify.extension.toml

```toml
type = "app_embed"
name = "your-app-embed"              # ✏️ 修改 extension 名称
handle = "your-app-embed"            # ✏️ 修改 handle

[[extensions.settings]]
name = "your-app-embed"              # ✏️ 修改设置名称
```

#### 📝 extensions/smart-seo-embed/locales/*.json

更新所有语言文件中的应用名称和描述：

```json
{
  "name": "Your App Name",           // ✏️ 修改名称
  "description": "Your app description"  // ✏️ 修改描述
}
```

### 4️⃣ 更新多语言文件

更新 `app/i18n/locales/` 下的所有语言文件，修改应用相关的文本：

```json
{
  "common": {
    "appName": "Your App Name"       // ✏️ 修改应用名称
  },
  "billing": {
    "plans": {
      // ... 根据实际业务修改套餐信息
    }
  }
}
```

### 5️⃣ 创建 Shopify App

```bash
# 1. 登录 Shopify Partners
shopify auth login

# 2. 初始化应用配置
shopify app dev

# 这会：
# - 创建或关联一个 Shopify App
# - 生成 client_id
# - 配置 OAuth 回调 URL
# - 更新 shopify.app.toml
```

### 6️⃣ 配置环境变量

创建 `.env` 文件：

```bash
# Shopify 配置（由 shopify app dev 自动生成）
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret

# 数据库配置
DATABASE_URL=file:./dev.sqlite

# 应用配置
APP_NAME=Your App Name
APP_VERSION=1.0.0
APP_AUTHOR_NAME=Your Name
APP_AUTHOR_EMAIL=your@email.com
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
```

### 7️⃣ 安装依赖并初始化数据库

```bash
# 安装依赖
npm install

# 初始化数据库
npm run setup

# 或者分步执行
npx prisma generate
npx prisma migrate dev
```

### 8️⃣ 初始化 Git 仓库

```bash
# 初始化新的 Git 仓库
git init

# 添加远程仓库
git remote add origin <your-new-repo-url>

# 提交初始代码
git add .
git commit -m "feat: 初始化项目"

# 推送到远程仓库
git push -u origin main
```

### 9️⃣ 启动开发

```bash
npm run dev
```

---

## 🔧 需要修改的文件清单

### 必须修改

- [ ] `package.json` - name, author
- [ ] `shopify.app.toml` - name
- [ ] `app/config/app.config.ts` - 应用信息
- [ ] `.env` - 环境变量（创建新文件）

### 建议修改

- [ ] `README.md` - 项目说明
- [ ] `extensions/*/shopify.extension.toml` - Extension 名称
- [ ] `extensions/*/locales/*.json` - Extension 多语言
- [ ] `app/i18n/locales/*.json` - 应用多语言
- [ ] `app/config/plans.ts` - 套餐配置（根据实际业务）
- [ ] `app/config/permissions.ts` - 权限配置（根据实际业务）

### 可选修改

- [ ] `public/favicon.ico` - 应用图标
- [ ] `CHANGELOG.md` - 更新日志
- [ ] `.cursorrules` - Cursor 规则（根据团队规范）

---

## 🗑️ 需要删除的文件

这些是基座项目的文档和示例，新项目不需要：

```bash
# 删除基座相关文档
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

# 删除示例文件
rm -f app/examples/subscription-usage.server.ts

# 删除基座说明文档
rm -f docs/CREATE_NEW_PROJECT.md
rm -f docs/TAILWIND_SETUP.md
rm -f docs/USER_SYSTEM_GUIDE.md

# 删除初始化脚本
rm -f init-new-project.sh
```

---

## ✅ 验证清单

完成以上步骤后，请验证：

- [ ] 应用可以正常启动 `npm run dev`
- [ ] 可以在开发店铺中安装应用
- [ ] 数据库连接正常
- [ ] 认证流程正常
- [ ] Extension 可以正常部署 `npm run deploy`
- [ ] 所有配置文件中的应用名称已更新
- [ ] Git 仓库已初始化并推送到远程
- [ ] 团队成员可以克隆并启动项目

---

## 📚 后续开发

### 1. 开发新功能

基座已经提供了完整的基础设施：

- ✅ 用户认证和会话管理
- ✅ 订阅系统（含配额管理）
- ✅ 权限系统（基于套餐的功能控制）
- ✅ 多语言支持
- ✅ Toast 通知系统
- ✅ MobX 状态管理
- ✅ Theme Extension 支持

你只需要：

1. 创建新的路由 (`app/routes/`)
2. 创建新的组件 (`app/components/`)
3. 添加新的 API 路由 (`app/routes/api.*.ts`)
4. 根据需要扩展权限和套餐配置

### 2. 自定义套餐

修改 `app/config/plans.ts`：

```typescript
export const PLANS: Record<PlanType, PlanConfig> = {
  [PlanType.FREE]: {
    name: "Free",
    price: {
      monthly: 0,
      yearly: 0
    },
    features: [
      Feature.BASIC_FEATURE,
      // 添加你的功能
    ]
  },
  // ... 其他套餐
}
```

### 3. 自定义权限

修改 `app/config/permissions.ts`：

```typescript
export enum Feature {
  BASIC_FEATURE = "basic_feature",
  YOUR_FEATURE = "your_feature",
  // 添加你的功能
}

export const PLAN_FEATURES: Record<PlanType, Feature[]> = {
  [PlanType.FREE]: [
    Feature.BASIC_FEATURE
  ],
  [PlanType.PROFESSIONAL]: [
    Feature.BASIC_FEATURE,
    Feature.YOUR_FEATURE
  ],
  // ... 其他套餐
}
```

### 4. 添加新的 Extension

```bash
# 生成新的 Extension
shopify app generate extension

# 选择类型（如 theme_app_extension, checkout_ui_extension）
# 开发 Extension
# 部署
npm run deploy
```

---

## 🐛 常见问题

### Q: shopify app dev 报错 "No app found"

**A**: 删除 `shopify.app.toml` 中的 `client_id`，重新运行 `shopify app dev`，会提示你创建或选择应用。

### Q: 数据库迁移失败

**A**: 确保已删除旧的数据库文件：

```bash
rm -f prisma/dev.sqlite*
npm run setup
```

### Q: Extension 部署失败

**A**: 检查 `extensions/*/shopify.extension.toml` 中的配置是否正确，特别是 `name` 和 `handle` 字段。

### Q: 多语言不生效

**A**: 检查：

1. 浏览器语言设置
2. `app/i18n/config.ts` 配置
3. 翻译文件是否存在

### Q: 订阅功能如何测试？

**A**: 在开发环境下，订阅流程会使用 Shopify 的测试模式，不会产生实际费用。详见 `docs/SUBSCRIPTION_SYSTEM.md`。

---

## 📞 获取帮助

如果遇到问题，请：

1. 查看项目文档（`docs/` 目录）
2. 查看 Shopify 官方文档：https://shopify.dev/docs/apps
3. 查看 React Router 文档：https://reactrouter.com
4. 提交 Issue 到项目仓库

---

## 🚀 部署到生产

准备部署时，请参考：

1. [Shopify App Deployment Guide](https://shopify.dev/docs/apps/deployment/web)
2. 更新环境变量 `NODE_ENV=production`
3. 配置生产数据库
4. 配置 HTTPS 域名
5. 部署 Extension：`npm run deploy`

---


