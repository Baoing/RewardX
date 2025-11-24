# Campaign Editor Diff 机制

## 📋 概述

Campaign Editor 使用了一套精细的 diff 比较算法来追踪用户的编辑状态，实现了自动保存提示、一键撤销等功能。

## 🔧 核心技术栈

- **mobx-utils**: `deepObserve` 自动监听状态变化
- **flat**: 扁平化对象，提供精确的深度比较
- **lodash-es**: `isEqual` 高性能比较，`cloneDeep` 深拷贝

## 🎯 工作原理

### 1. 初始化编辑器

```typescript
// 当用户打开一个 campaign 详情页时
editorStore.initEditor(campaign)
```

**内部流程**：
1. 深拷贝 `campaign` 数据为 `originalCampaign`（原始数据）
2. 深拷贝 `campaign` 数据为 `editingCampaign`（编辑中的数据）
3. 注册 `deepObserve` 监听器，自动监听 `editingCampaign` 的变化

### 2. 自动监听变化

```typescript
this.disposer = deepObserve(this, (change) => {
  if (change.type === "update" && change.observableKind === "object") {
    this.compareAndUpdateStatus()
  }
})
```

**触发条件**：
- 用户修改任何字段（如 `name`, `type`, `minOrderAmount`）
- 用户修改嵌套对象（如 `content.title`, `styles.mainTextColor`）

### 3. 精确比较算法

```typescript
private compareAndUpdateStatus() {
  // 1. 扁平化对象
  const baseFlat = flatten(this.originalCampaign, { safe: true })
  const nowFlat = flatten(this.editingCampaign, { safe: true })

  // 2. 忽略只读字段
  const ignoredFields = [
    "id", "userId", "createdAt", "updatedAt", 
    "totalPlays", "totalWins", "totalOrders"
  ]
  ignoredFields.forEach(field => {
    delete baseFlat[field]
    delete nowFlat[field]
  })

  // 3. 精确比较
  const isChanged = !isEqual(baseFlat, nowFlat)
  this.hasUnsavedChanges = isChanged
}
```

**扁平化示例**：

```typescript
// 原始对象
{
  name: "Campaign 1",
  content: {
    title: "Win Big",
    description: "Play now"
  }
}

// 扁平化后
{
  "name": "Campaign 1",
  "content.title": "Win Big",
  "content.description": "Play now"
}
```

**优势**：
- 对象键的顺序不影响比较结果
- 可以精确忽略特定字段（如 `updatedAt`）
- 支持深度嵌套的对象和数组比较

## 📊 按钮状态自动控制

### Save 按钮

```typescript
<Button
  onClick={handleSave}
  disabled={!editorStore.hasUnsavedChanges} // 无改动时禁用
  loading={editorStore.isSaving}             // 保存中显示 loading
>
  Save
</Button>
```

### Discard 按钮

```typescript
<Button
  onClick={handleDiscard}
  disabled={!editorStore.hasUnsavedChanges} // 无改动时禁用
>
  Discard
</Button>
```

### 实时更新

- 用户修改任何字段 → `hasUnsavedChanges` 自动变为 `true` → 按钮启用
- 用户保存成功 → `hasUnsavedChanges` 自动变为 `false` → 按钮禁用
- 用户撤销更改 → `hasUnsavedChanges` 自动变为 `false` → 按钮禁用

## 🔄 保存流程

### 1. 获取变更字段

```typescript
const changes = editorStore.changedFields
// 例如: { name: "New Name", minOrderAmount: 100 }
```

**优化**：只提交变更的字段，减少网络请求大小

### 2. 调用 API

```typescript
const success = await campaignStore.updateCampaign(id, changes)
```

### 3. 标记保存成功

```typescript
if (success) {
  editorStore.markSaved() // 更新 originalCampaign
}
```

**内部流程**：
1. 临时销毁监听器（避免触发不必要的比较）
2. 深拷贝 `editingCampaign` 作为新的 `originalCampaign`
3. 设置 `hasUnsavedChanges = false`
4. 重新注册监听器

## ↩️ 撤销流程

### 用户点击 Discard

```typescript
const handleDiscard = () => {
  editorStore.discardChanges()
}
```

**内部流程**：
1. 临时销毁监听器
2. 深拷贝 `originalCampaign` 恢复到 `editingCampaign`
3. 设置 `hasUnsavedChanges = false`
4. 重新注册监听器

**结果**：所有修改被撤销，UI 恢复到初始状态

## 🎯 特殊处理：Publish 字段

### 立即更新 vs 批量保存

- **Publish (isActive)**: 修改后立即调用 API ✅
- **其他字段**: 等待用户点击 Save 按钮 ⏸️

### 实现方式

```typescript
// RulesTab.tsx
const handlePublishChange = async (checked: boolean) => {
  // 1. 更新编辑状态
  editorStore.updateField("isActive", checked)
  
  // 2. 立即调用 API
  const success = await campaignStore.updateCampaign(id, { isActive: checked })
  
  if (success) {
    // 3. 标记保存成功（避免被标记为未保存）
    editorStore.markSaved()
  } else {
    // 4. 失败时回滚
    editorStore.updateField("isActive", !checked)
  }
}
```

## 🧪 测试场景

### 场景 1: 修改单个字段

```
1. 用户修改 Campaign Name: "Campaign 1" → "Campaign 2"
2. hasUnsavedChanges: false → true
3. Save 按钮: disabled → enabled
4. 用户点击 Save
5. API 调用: { name: "Campaign 2" }
6. hasUnsavedChanges: true → false
7. Save 按钮: enabled → disabled
```

### 场景 2: 修改嵌套字段

```
1. 用户修改 Content Title: "Win Big" → "Win Bigger"
2. hasUnsavedChanges: false → true
3. changedFields: { content: { title: "Win Bigger", ... } }
```

### 场景 3: 撤销更改

```
1. 用户修改多个字段
2. hasUnsavedChanges: true
3. 用户点击 Discard
4. 所有修改被撤销
5. hasUnsavedChanges: false
6. UI 恢复到初始状态
```

### 场景 4: 只修改 Publish

```
1. 用户切换 Publish: false → true
2. 立即调用 API
3. markSaved() 被调用
4. hasUnsavedChanges: false （不会影响其他修改）
```

## 🚀 性能优化

### 1. 扁平化对象

- 使用 `flat` 库扁平化对象，O(n) 时间复杂度
- 避免递归比较，性能更好

### 2. 忽略只读字段

- 在比较时忽略 `id`, `createdAt`, `updatedAt` 等只读字段
- 减少不必要的比较

### 3. 临时销毁监听器

- 在 `discardChanges()` 和 `markSaved()` 时临时销毁监听器
- 避免触发不必要的比较和渲染

### 4. 只提交变更字段

- `changedFields` 只返回变更的字段
- 减少网络请求大小

## 📝 日志输出

编辑器会输出详细的日志，方便调试：

```
🔧 Initializing campaign editor
✅ Campaign editor listener registered
📊 hasUnsavedChanges: true
📝 Changed fields: ["name", "minOrderAmount"]
↩️ Discarding all changes
✅ Marking as saved, updating original data
❌ Campaign editor listener destroyed
🧹 Resetting campaign editor
```

## 🎓 最佳实践

### 1. 只使用 editorStore 编辑数据

```typescript
// ✅ 正确
editorStore.updateField("name", "New Name")

// ❌ 错误
campaign.name = "New Name" // 不会触发 diff 比较
```

### 2. 特殊字段立即更新

```typescript
// ✅ 对于需要立即生效的字段（如 Publish）
editorStore.updateField("isActive", checked)
await campaignStore.updateCampaign(id, { isActive: checked })
editorStore.markSaved() // 重要：避免被标记为未保存
```

### 3. 批量更新使用 updateFields

```typescript
// ✅ 批量更新
editorStore.updateFields({
  name: "New Name",
  type: "order",
  minOrderAmount: 100
})

// ❌ 多次单独更新（会触发多次比较）
editorStore.updateField("name", "New Name")
editorStore.updateField("type", "order")
editorStore.updateField("minOrderAmount", 100)
```

## 🔗 相关文件

- `app/stores/campaignEditorStore.ts` - 编辑器状态管理
- `app/routes/_app.campaigns.$id/route.tsx` - 主编辑器页面
- `app/routes/_app.campaigns.$id/components/RulesTab.tsx` - Rules Tab（包含 Publish 特殊处理）
- `app/routes/_app.campaigns.$id/components/ContentTab.tsx` - Content Tab
- `app/routes/_app.campaigns.$id/components/StylesTab.tsx` - Styles Tab

## 📚 参考资料

- [mobx-utils deepObserve](https://github.com/mobxjs/mobx-utils#deepobserve)
- [flat](https://github.com/hughsk/flat)
- [lodash isEqual](https://lodash.com/docs/#isEqual)

