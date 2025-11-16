# RewardX – Spin, Win & Repeat

A Shopify app built with React Router

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

```bash
# 安装依赖
npm install

# 初始化数据库
npm run setup

# 启动开发
npm run dev
```

### 开发

```bash
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
```

## 项目结构

```
app/
├── routes/                 # 路由文件
├── components/            # 可复用组件
├── stores/                # MobX 状态管理
├── hooks/                 # 自定义 Hooks
├── utils/                 # 工具函数
├── services/              # 业务逻辑服务
├── config/                # 配置文件
└── i18n/                  # 国际化
```

## 功能特性

- ✅ 用户认证和会话管理
- ✅ 订阅系统（含配额管理）
- ✅ 权限系统（基于套餐的功能控制）
- ✅ 多语言支持
- ✅ Toast 通知系统
- ✅ MobX 状态管理
- ✅ Theme Extension 支持

## 文档

详细文档请查看 `docs/` 目录。

## 作者

RewardX <will@baoea.com>

## 许可证

MIT
