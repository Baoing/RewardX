# RewardX Lottery Game Theme App Extension

这是一个完整的 Shopify Theme App Extension，用于在店铺前台嵌入 RewardX 抽奖游戏。

## 📁 文件结构

```
rewardx-lottery-extension/
├── shopify.extension.toml      # 扩展配置文件
├── blocks/
│   └── app-embed.liquid         # App Block（核心）
├── assets/
│   ├── lottery-game.js          # 抽奖游戏脚本（构建产物）
│   └── app-embed.js             # 兼容性脚本
└── locales/
    ├── en.default.json          # 英文翻译
    └── zh-CN.json               # 中文翻译
```

## ✨ 功能特性

### 1. **App Block**
- ✅ 可在主题编辑器中添加到任意 Section
- ✅ 自动获取商店最新的活跃活动
- ✅ 无需手动配置 Campaign ID
- ✅ 响应式设计，支持移动端和桌面端

### 2. **自动活动加载**
- ✅ 自动调用 `/api/campaigns/latest` 获取最新活动
- ✅ 如果没有活跃活动，显示友好提示
- ✅ 支持指定 Campaign ID（通过 `data-campaign-id` 属性）

### 3. **抽奖游戏功能**
- ✅ 九宫格抽奖游戏
- ✅ 订单验证抽奖
- ✅ 邮件订阅抽奖
- ✅ 实时中奖提示

## 🚀 使用方式

### 1. 构建插件

```bash
npm run build:plugin
```

构建产物会自动输出到 `extensions/rewardx-lottery-extension/assets/lottery-game.js`。

### 2. 部署扩展

```bash
shopify app deploy
```

### 3. 在主题编辑器中使用

1. 打开 Shopify Admin > Online Store > Themes
2. 点击当前主题的 **Customize** 按钮
3. 在任意 Section 中添加 **RewardX Lottery Game** block
4. 保存设置

## 📝 技术实现

### Liquid 模板

`blocks/app-embed.liquid` 负责：
- 渲染抽奖游戏容器
- 加载 `lottery-game.js` 脚本
- 提供基本的样式

### JavaScript 初始化

`assets/lottery-game.js`（由 `app/plugin/main.tsx` 构建）负责：
- 查找所有 `[data-rewardx-lottery]` 容器
- 自动调用 API 获取最新活动
- 初始化 React 组件并渲染抽奖游戏

### API 端点

- `GET /api/campaigns/latest` - 获取最新的活跃活动
- `GET /api/campaigns/:id` - 获取指定活动（如果提供了 `data-campaign-id`）

## 🔧 开发

### 本地开发

```bash
# 开发模式（带 HMR）
npm run dev:plugin

# 构建生产版本
npm run build:plugin
```

### 文件说明

- `app/plugin/main.tsx` - 插件入口文件，包含初始化逻辑
- `app/plugin/component/` - React 组件（NineBoxLottery, LotteryModal）
- `extensions/rewardx-lottery-extension/` - Shopify Theme Extension 文件

## 📚 相关文档

- [Shopify Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [App Blocks](https://shopify.dev/docs/apps/online-store/theme-app-extensions/extensions-framework/blocks)
