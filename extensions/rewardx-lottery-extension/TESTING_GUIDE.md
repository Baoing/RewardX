# 🚀 RewardX Lottery Game Extension - 快速测试指南

## ✅ 文件结构

```
✅ shopify.extension.toml      - 扩展配置
✅ blocks/app-embed.liquid      - App Block（核心）
✅ assets/lottery-game.js       - 抽奖游戏脚本（构建产物）
✅ assets/app-embed.js         - 兼容性脚本
✅ locales/en.default.json      - 英文翻译
✅ locales/zh-CN.json           - 中文翻译
✅ README.md                    - 详细文档
```

## 📋 测试步骤

### 1. 构建插件

```bash
# 构建生产版本
npm run build:plugin
```

构建产物会自动输出到 `extensions/rewardx-lottery-extension/assets/lottery-game.js`。

### 2. 部署扩展到 Shopify

```bash
# 方式1：部署所有扩展
shopify app deploy

# 方式2：只部署这个扩展
cd extensions/rewardx-lottery-extension
shopify app extension deploy
```

### 3. 在主题编辑器中添加 Block

1. 打开浏览器，访问你的 Shopify Admin
2. 进入 **Online Store > Themes**
3. 点击当前主题的 **Customize** 按钮
4. 在任意 Section 中，点击 **Add block**
5. 找到 **RewardX Lottery Game** block，点击添加
6. 无需任何配置，系统会自动获取最新的活跃活动
7. 点击 **Save** 保存设置

### 4. 验证功能

#### 前台验证

访问店铺前台（添加了 block 的页面），应该看到：

```
┌─────────────────────────────┐
│                             │
│     店铺内容...             │
│                             │
│    ┌─────────────────────┐  │
│    │   RewardX Lottery   │  │
│    │      Game           │  │
│    │                     │  │
│    │   [九宫格抽奖]      │  │
│    └─────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**功能特性：**
- ✅ 自动加载最新的活跃活动
- ✅ 显示九宫格抽奖游戏
- ✅ 支持订单验证抽奖
- ✅ 支持邮件订阅抽奖
- ✅ 响应式设计

#### 控制台验证

按 `F12` 打开浏览器开发者工具，查看控制台：

```bash
🎮 RewardX: Found 1 lottery container(s)
📡 RewardX: Loading latest active campaign
✅ RewardX: Campaign loaded - 活动名称 (campaign-id)
✅ Lottery game initialized (Campaign: campaign-id)
```

#### 源代码验证

**检查注入的容器：**
```html
<div class="rewardx-lottery-block" data-rewardx-block-id="...">
  <div class="rewardx-lottery-container" data-rewardx-lottery></div>
</div>
```

**检查加载的脚本：**
```html
<script src="/extensions/rewardx-lottery-extension/assets/lottery-game.js" defer></script>
```

### 5. 测试不同场景

#### 测试自动活动加载

1. 确保至少有一个活跃的活动（`isActive: true`）
2. 在主题编辑器中添加 RewardX Lottery Game block
3. 保存并查看前台
4. 应该自动显示最新的活跃活动

#### 测试无活动情况

1. 将所有活动设置为非活跃状态（`isActive: false`）
2. 刷新前台页面
3. 应该显示 "No active lottery campaign available." 提示

#### 测试指定活动

如果需要指定特定活动，可以在 Liquid 模板中添加 `data-campaign-id`：

```liquid
<div data-rewardx-lottery data-campaign-id="your-campaign-id"></div>
```

### 6. 调试技巧

#### 检查 API 响应

在浏览器控制台中手动调用 API：

```javascript
fetch('/api/campaigns/latest', { credentials: 'include' })
  .then(res => res.json())
  .then(data => console.log('Latest campaign:', data))
```

#### 检查活动数据

```javascript
// 检查全局 RewardX 对象
console.log(window.RewardX)

// 检查已加载的活动
console.log(window.RewardXLottery)
```

#### 检查容器

```javascript
// 查找所有抽奖容器
document.querySelectorAll('[data-rewardx-lottery]')

// 检查容器内容
document.querySelector('[data-rewardx-lottery]').innerHTML
```

## ⚠️ 常见问题

### 1. Block 不显示

**可能原因：**
- 没有活跃的活动
- API 调用失败
- JavaScript 脚本未加载

**解决方法：**
- 检查控制台错误信息
- 确认至少有一个 `isActive: true` 的活动
- 检查网络请求是否成功

### 2. 活动数据加载失败

**可能原因：**
- API 端点路径错误
- 认证问题
- 网络连接问题

**解决方法：**
- 检查 API 端点 `/api/campaigns/latest` 是否可访问
- 检查浏览器控制台的网络请求
- 确认 Shopify session 有效

### 3. 样式显示异常

**可能原因：**
- CSS 冲突
- 主题样式覆盖

**解决方法：**
- 检查浏览器开发者工具的样式面板
- 调整 block 的容器样式
- 检查主题的 CSS 是否冲突

## 📚 相关文档

- [README.md](./README.md) - 详细文档
- [Shopify Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [App Blocks](https://shopify.dev/docs/apps/online-store/theme-app-extensions/extensions-framework/blocks)
