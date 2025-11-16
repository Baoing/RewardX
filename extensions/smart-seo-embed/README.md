# SmartSEO Theme App Extension

这是一个完整的 Shopify Theme App Extension，用于在店铺前台注入 SEO 优化功能。

## 📁 文件结构

```
smart-seo-embed/
├── shopify.extension.toml      # 扩展配置文件
├── blocks/
│   └── app-embed.liquid         # App Embed Block（核心）
├── assets/
│   └── app-embed.js             # JavaScript 功能
└── locales/
    ├── en.default.json          # 英文翻译
    └── zh-CN.json               # 中文翻译
```

## ✨ 功能特性

### 1. **App Embed Block**
- ✅ 可在主题编辑器中启用/禁用
- ✅ 自动注入到所有页面的 `<body>` 标签中
- ✅ 可配置的徽章显示

### 2. **SEO 优化功能**
- ✅ 自动优化 Meta 标签
- ✅ 添加 Open Graph 标签
- ✅ 添加 Twitter Card 标签
- ✅ 结构化数据 (Schema.org)
- ✅ 页面浏览追踪

### 3. **可定制徽章**
- ✅ 显示/隐藏开关
- ✅ 自定义文本
- ✅ 4个位置选项（左上、右上、左下、右下）
- ✅ 透明度调节（0-100%）
- ✅ 自定义颜色
- ✅ 响应式设计

### 4. **多语言支持**
- ✅ 英文 (en)
- ✅ 简体中文 (zh-CN)

## 🎨 主题编辑器设置

启用 App Embed 后，商家可以在主题编辑器中配置：

### Show SmartSEO Badge
- 类型: 复选框
- 默认: 开启
- 功能: 显示/隐藏徽章

### Badge Text
- 类型: 文本
- 默认: "Optimized by SmartSEO"
- 功能: 自定义徽章文本

### Badge Position
- 类型: 下拉选择
- 选项: 左上/右上/左下/右下
- 默认: 右下
- 功能: 设置徽章位置

### Badge Opacity
- 类型: 滑块
- 范围: 0-100%
- 步进: 10%
- 默认: 80%
- 功能: 设置徽章透明度

### Badge Color
- 类型: 颜色选择器
- 默认: #008060 (Shopify 绿色)
- 功能: 自定义徽章背景色

## 🔧 技术实现

### Liquid 模板

```liquid
{% comment %}
  app-embed.liquid 会被注入到每个页面的 <body> 标签中
  可以访问所有 Shopify Liquid 对象（shop, cart, request 等）
{% endcomment %}

<div id="smartseo-app-embed">
  <script type="application/json" id="smartseo-config">
    {
      "shop": "{{ shop.permanent_domain }}",
      "pageType": "{{ request.page_type }}",
      "locale": "{{ request.locale.iso_code }}"
    }
  </script>
</div>
```

### JavaScript API

```javascript
// 全局 API
window.SmartSEO = {
  config: {...},        // 配置对象
  init: function() {},  // 初始化
  optimizeMetaTags: function() {},
  setupStructuredData: function() {},
  trackPageView: function() {}
}
```

### 数据结构

**配置对象：**
```json
{
  "shop": "example.myshopify.com",
  "pageType": "index",
  "locale": "zh-CN",
  "currency": "CNY",
  "settings": {
    "showBadge": true,
    "badgeText": "Optimized by SmartSEO",
    "badgePosition": "bottom-right",
    "badgeOpacity": 80,
    "badgeColor": "#008060"
  }
}
```

## 🚀 部署步骤

### 1. 推送到 Shopify

```bash
# 在项目根目录运行
shopify app deploy
```

### 2. 在主题编辑器中启用

1. 登录 Shopify Admin
2. 进入 **Online Store > Themes**
3. 点击 **Customize**
4. 在左侧菜单最底部找到 **App embeds**
5. 找到 **SmartSEO Embed** 并启用
6. 配置设置选项
7. 点击 **Save**

### 3. 验证功能

打开店铺前台，检查：
- ✅ 徽章是否显示
- ✅ 控制台是否有初始化日志
- ✅ Meta 标签是否添加
- ✅ 结构化数据是否存在

## 📊 控制台日志

正常情况下，浏览器控制台会显示：

```
🚀 SmartSEO initialized {shop: "...", pageType: "...", ...}
📝 Meta tags optimized
🔗 Structured data added
📊 Page view tracked: {...}
✅ SmartSEO optimization complete
```

## 🎯 使用场景

### 1. SEO 优化
自动为每个页面添加必要的 SEO 标签和结构化数据。

### 2. 分析追踪
追踪页面浏览，收集用户行为数据。

### 3. 品牌展示
通过徽章展示店铺使用了 SEO 优化服务。

### 4. A/B 测试
可以根据配置动态调整页面元素。

## 🔄 与应用后端集成

### 发送数据到后端

```javascript
// 在 app-embed.js 中
fetch('https://your-app-backend.com/api/analytics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Shop': config.shop
  },
  body: JSON.stringify({
    pageType: config.pageType,
    locale: config.locale,
    url: window.location.href
  })
})
```

### 接收后端数据

```javascript
// 获取 SEO 建议
fetch('https://your-app-backend.com/api/seo-suggestions?shop=' + config.shop)
  .then(res => res.json())
  .then(data => {
    console.log('SEO Suggestions:', data)
    // 应用建议...
  })
```

## 🛠️ 调试技巧

### 1. 检查配置

```javascript
// 在浏览器控制台
console.log(window.SmartSEO.config)
```

### 2. 查看注入的元素

```javascript
// 查看 App Embed 容器
console.log(document.getElementById('smartseo-app-embed'))

// 查看徽章
console.log(document.getElementById('smartseo-badge'))
```

### 3. 测试不同页面类型

访问不同类型的页面，观察 `pageType` 变化：
- 首页: `index`
- 产品页: `product`
- 集合页: `collection`
- 文章页: `article`
- 购物车: `cart`

## ⚠️ 注意事项

### 1. 性能影响
- JavaScript 代码会在每个页面加载
- 保持代码轻量，避免阻塞渲染
- 使用异步加载外部资源

### 2. 主题兼容性
- 测试在不同主题上的表现
- 确保样式不与主题冲突
- 使用唯一的 class 名称和 ID

### 3. 隐私合规
- 追踪用户行为需要遵守 GDPR/CCPA
- 提供隐私政策和退出选项
- 不收集敏感信息

### 4. 更新策略
- 修改代码后需要重新部署
- 商家需要在主题编辑器中看到更新
- 考虑版本兼容性

## 📚 相关文档

- [Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [App Embed Blocks](https://shopify.dev/docs/apps/online-store/theme-app-extensions/extensions-framework/blocks)
- [Liquid Objects](https://shopify.dev/docs/api/liquid/objects)
- [Schema Settings](https://shopify.dev/docs/apps/online-store/theme-app-extensions/extensions-framework/configuration#settings)

## 🎉 下一步

1. ✅ 部署扩展到 Shopify
2. ✅ 在开发店铺测试
3. ✅ 配置徽章样式
4. ✅ 验证 SEO 功能
5. ✅ 集成后端 API
6. ✅ 收集用户反馈
7. ✅ 迭代优化

---

**提示：** 这个 Extension 是完全功能的，可以直接部署测试！


