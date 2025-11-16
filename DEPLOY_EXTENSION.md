# 🚀 部署 Theme Extension 指南

## ✅ 配置文件已修复

`shopify.extension.toml` 已更新：
- ✅ 添加了 `handle = "smart-seo-theme-extension"`
- ✅ 移除了顶层的 `name` 和 `handle`（不需要）
- ✅ 保持 `[[extensions]]` 配置正确

## 📋 部署步骤

### 方式 1: 交互式部署（推荐）

在**交互式终端**中运行（直接在 macOS Terminal 或 iTerm2 中）：

```bash
cd /Users/a333/WebstormProjects/shopify-app-starter
shopify app deploy
```

系统会提示你：
1. 选择要部署的扩展
2. 确认部署信息
3. 等待部署完成

### 方式 2: 非交互式部署

如果需要在脚本或 CI 中使用：

```bash
shopify app deploy --force
```

## 🎯 部署后操作

### 1. 验证扩展已部署

访问 Shopify Partner Dashboard：
1. 进入你的应用
2. 点击 **Extensions**
3. 应该看到 **SmartSEO Theme Extension**

### 2. 在开发店铺测试

1. **打开主题编辑器**
   ```
   Admin > Online Store > Themes > Customize
   ```

2. **找到 App Embeds**
   - 在左侧菜单**最底部**
   - 应该看到 **App Embed** (来自 SmartSEO Theme Extension)

3. **启用 App Embed**
   - 打开开关
   - 配置设置（徽章文本、位置、颜色等）
   - 点击 **Save**

4. **验证前台效果**
   - 访问店铺前台
   - 应该看到徽章显示在配置的位置
   - 打开浏览器控制台，查看初始化日志

### 3. 测试自动启用功能

1. **在主题编辑器中禁用 App Embed**（如果已启用）

2. **刷新应用首页**
   - 应该看到黄色 Banner 提示

3. **点击"一键启用"按钮**
   - 等待 Loading 状态
   - 应该显示成功消息
   - Banner 2秒后自动隐藏

4. **验证效果**
   - 回到主题编辑器
   - App Embed 应该已自动启用
   - 前台应该显示徽章

## 🐛 常见问题

### 问题 1: 部署失败 - "Missing handle"
**原因:** `shopify.extension.toml` 配置错误

**解决:** 确保文件内容如下：
```toml
api_version = "2025-01"

[[extensions]]
type = "theme"
name = "SmartSEO Theme Extension"
handle = "smart-seo-theme-extension"
```

### 问题 2: 主题编辑器找不到 App Embed
**可能原因:**
1. 扩展未成功部署
2. 需要刷新主题编辑器页面
3. 应用未正确安装到开发店铺

**解决:**
```bash
# 1. 重新部署
shopify app deploy

# 2. 重新安装应用到开发店铺
# 在 Partner Dashboard 中点击 "Test your app"
```

### 问题 3: 前台看不到徽章
**检查清单:**
- ✅ App Embed 在主题编辑器中已启用？
- ✅ "Show SmartSEO Badge" 设置已开启？
- ✅ Badge Opacity 大于 0？
- ✅ 浏览器控制台有初始化日志？

### 问题 4: 一键启用失败
**查看控制台错误:**
```bash
❌ 读取主题设置失败: 403 Forbidden
```

**原因:** 缺少 `write_themes` 权限

**解决:**
1. 检查 `shopify.app.toml` 中是否有 `write_themes` 权限
2. 重新安装应用以获取新权限

## 📊 预期日志

### 部署成功
```
✓ Deployed theme extension: SmartSEO Theme Extension
✓ Extensions deployed to Shopify Partners
```

### 启用成功
```bash
🔍 开始检测 App Embed 状态...
✅ 找到主题: Horizon ID: 187331674193
📖 读取主题设置: 187331674193
✅ 成功读取主题设置
⚠️ App Embed 未启用

🚀 开始自动启用 App Embed...
📝 添加 App Embed 配置: app-embed-1699123456789
💾 更新主题设置: 187331674193
✅ 成功更新主题设置
✅ App Embed 启用成功: app-embed-1699123456789
```

### 前台日志
```bash
🚀 SmartSEO initialized {...}
📝 Meta tags optimized
🔗 Structured data added
📊 Page view tracked: {...}
✅ SmartSEO optimization complete
```

## 🎉 完成检查清单

部署完成后，确认以下所有项目：

- [ ] Theme Extension 已成功部署到 Shopify
- [ ] 在主题编辑器中可以看到 App Embed
- [ ] 手动启用后前台显示徽章
- [ ] 浏览器控制台有完整的初始化日志
- [ ] Meta 标签被正确添加到页面
- [ ] 结构化数据存在于页面源代码中
- [ ] 一键启用功能正常工作
- [ ] 徽章交互功能正常（悬停、点击）
- [ ] 移动端显示正常

## 📚 相关文档

- [Extension 功能文档](./extensions/smart-seo-embed/README.md)
- [测试指南](./extensions/smart-seo-embed/TESTING_GUIDE.md)
- [App Embed 实现指南](./APP_EMBED_GUIDE.md)
- [主题扩展总结](./THEME_EXTENSION_SUMMARY.md)

---

**准备好了吗？** 在交互式终端中运行 `shopify app deploy` 开始部署！🚀
