# 权限系统使用指南

## 📋 目录

1. [基础使用](#基础使用)
2. [组件示例](#组件示例)
3. [Hook 使用](#hook-使用)
4. [工具函数](#工具函数)
5. [最佳实践](#最佳实践)

---

## 基础使用

### 1. 使用 `usePermission` Hook

```typescript
import { usePermission } from "~/hooks/usePermission"
import { Feature } from "~/config/permissions"

function MyComponent() {
  const { hasAccess, isProfessional } = usePermission()
  
  // 检查是否有权限使用 AI 功能
  const canUseAI = hasAccess(Feature.AI_SUGGESTIONS)
  
  // 检查是否是 Professional 或更高套餐
  const isPro = isProfessional
  
  return (
    <div>
      {canUseAI && <Button>AI 优化</Button>}
      {isPro && <AdvancedFeatures />}
    </div>
  )
}
```

---

## 组件示例

### 示例 1：禁用按钮（Professional 功能）

```typescript
import { Button } from "@shopify/polaris"
import { usePermission } from "~/hooks/usePermission"
import { Feature } from "~/config/permissions"

function AIOptimizeButton() {
  const { hasAccess } = usePermission()
  const canUseAI = hasAccess(Feature.AI_SUGGESTIONS)
  
  return (
    <Button
      disabled={!canUseAI}
      onClick={handleAIOptimize}
    >
      AI 优化建议
    </Button>
  )
}
```

---

### 示例 2：使用 `RestrictedButton` 组件

```typescript
import { RestrictedButton } from "~/components/FeatureGate"
import { Feature } from "~/config/permissions"

function BulkOptimizeButton() {
  return (
    <RestrictedButton
      feature={Feature.BULK_TOOLS}
      onClick={handleBulkOptimize}
      showBadge={true}
    >
      批量优化
    </RestrictedButton>
  )
}
```

**效果**：
- 有权限：正常显示按钮，可点击
- 无权限：按钮可点击，点击后跳转到套餐页面，并显示 "Professional" 徽章

---

### 示例 3：使用 `FeatureGate` 隐藏功能

```typescript
import { FeatureGate } from "~/components/FeatureGate"
import { Feature } from "~/config/permissions"

function AdvancedSettings() {
  return (
    <FeatureGate feature={Feature.ADVANCED_SCHEMA}>
      <Card>
        <Text>高级 Schema 设置</Text>
        {/* 只有 Professional 或更高套餐才能看到 */}
      </Card>
    </FeatureGate>
  )
}
```

---

### 示例 4：显示升级提示

```typescript
import { FeatureGate } from "~/components/FeatureGate"
import { Feature } from "~/config/permissions"

function APIAccessSection() {
  return (
    <FeatureGate
      feature={Feature.API_ACCESS}
      showUpgradeBanner={true}
      fallback={
        <Card subdued>
          <Text tone="subdued">API 访问功能已锁定</Text>
        </Card>
      }
    >
      <Card>
        <Text>API 密钥管理</Text>
        <TextField label="API Key" value="sk-..." />
      </Card>
    </FeatureGate>
  )
}
```

**效果**：
- 有权限：显示 API 密钥管理界面
- 无权限：显示升级提示 Banner + fallback 内容

---

### 示例 5：条件渲染不同内容

```typescript
import { usePermission } from "~/hooks/usePermission"
import { PlanType } from "~/config/plans"

function QuotaDisplay() {
  const { currentPlan, requiresPlan } = usePermission()
  
  if (requiresPlan(PlanType.ENTERPRISE)) {
    return <Text>无限配额</Text>
  }
  
  if (requiresPlan(PlanType.PROFESSIONAL)) {
    return <Text>500 次/月</Text>
  }
  
  if (requiresPlan(PlanType.STARTER)) {
    return <Text>100 次/月</Text>
  }
  
  return <Text>20 次/月</Text>
}
```

---

### 示例 6：功能列表带徽章

```typescript
import { PlanBadge } from "~/components/FeatureGate"
import { usePermission } from "~/hooks/usePermission"
import { Feature } from "~/config/permissions"
import { PlanType } from "~/config/plans"

function FeatureList() {
  const { hasAccess } = usePermission()
  
  const features = [
    { id: Feature.AUTO_META, name: "自动 Meta 标签", plan: PlanType.STARTER },
    { id: Feature.AI_SUGGESTIONS, name: "AI 优化", plan: PlanType.PROFESSIONAL },
    { id: Feature.API_ACCESS, name: "API 访问", plan: PlanType.ENTERPRISE }
  ]
  
  return (
    <List>
      {features.map(feature => (
        <List.Item key={feature.id}>
          <InlineStack gap="200" align="space-between">
            <Text tone={hasAccess(feature.id) ? "base" : "subdued"}>
              {feature.name}
            </Text>
            <PlanBadge plan={feature.plan} />
          </InlineStack>
        </List.Item>
      ))}
    </List>
  )
}
```

---

## Hook 使用

### `usePermission` 返回值

```typescript
const {
  currentPlan,        // 当前套餐
  hasAccess,          // 检查功能权限
  requiresPlan,       // 检查套餐等级
  getFeatureRequirement, // 获取功能所需套餐
  isFree,             // 是否是 Free
  isStarter,          // 是否是 Starter 或更高
  isProfessional,     // 是否是 Professional 或更高
  isEnterprise        // 是否是 Enterprise
} = usePermission()
```

### 使用示例

```typescript
// 检查单个功能
const canUseAI = hasAccess(Feature.AI_SUGGESTIONS)

// 检查套餐等级
const isPro = requiresPlan(PlanType.PROFESSIONAL)

// 获取功能要求
const requiredPlan = getFeatureRequirement(Feature.BULK_TOOLS)

// 快捷判断
if (isProfessional) {
  // 显示 Professional 功能
}

if (isEnterprise) {
  // 显示 Enterprise 功能
}
```

---

## 工具函数

### 1. `hasFeatureAccess`

```typescript
import { hasFeatureAccess } from "~/config/permissions"
import { Feature } from "~/config/permissions"
import { PlanType } from "~/config/plans"

// 服务端使用
export const loader = async ({ request }) => {
  const currentPlan = await getUserPlan(request)
  const canUseAI = hasFeatureAccess(currentPlan, Feature.AI_SUGGESTIONS)
  
  return { canUseAI }
}
```

---

### 2. `isPlanOrHigher`

```typescript
import { isPlanOrHigher } from "~/config/permissions"
import { PlanType } from "~/config/plans"

// 检查是否至少是 Professional
const isPro = isPlanOrHigher(currentPlan, PlanType.PROFESSIONAL)
```

---

### 3. `getAvailableFeatures`

```typescript
import { getAvailableFeatures } from "~/config/permissions"

// 获取用户所有可用功能
const features = getAvailableFeatures(currentPlan)
console.log(features) // [Feature.BASIC_TRACKING, Feature.AUTO_META, ...]
```

---

### 4. `getUnlockedFeatures`

```typescript
import { getUnlockedFeatures } from "~/config/permissions"
import { PlanType } from "~/config/plans"

// 获取升级后解锁的新功能
const newFeatures = getUnlockedFeatures(
  PlanType.STARTER,
  PlanType.PROFESSIONAL
)
console.log(newFeatures) // [Feature.AI_SUGGESTIONS, Feature.BULK_TOOLS, ...]
```

---

## 最佳实践

### 1. 在路由 loader 中提供 `currentPlan`

```typescript
// app/routes/_app.tsx
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request)
  const user = await getUserByShop(session.shop)
  const subscription = await getCurrentSubscription(user.id)
  
  return {
    currentPlan: subscription?.planType || PlanType.FREE,
    // ... 其他数据
  }
}
```

### 2. 组件中优先使用 Hook

```typescript
// ✅ 推荐：使用 Hook
function MyComponent() {
  const { hasAccess } = usePermission()
  const canUseAI = hasAccess(Feature.AI_SUGGESTIONS)
  
  return <Button disabled={!canUseAI}>AI 优化</Button>
}

// ❌ 不推荐：直接从 loader 读取
function MyComponent() {
  const { currentPlan } = useLoaderData()
  const canUseAI = hasFeatureAccess(currentPlan, Feature.AI_SUGGESTIONS)
  
  return <Button disabled={!canUseAI}>AI 优化</Button>
}
```

### 3. 使用语义化的组件

```typescript
// ✅ 推荐：使用 RestrictedButton
<RestrictedButton feature={Feature.AI_SUGGESTIONS}>
  AI 优化
</RestrictedButton>

// ❌ 不推荐：手动判断
const { hasAccess } = usePermission()
<Button disabled={!hasAccess(Feature.AI_SUGGESTIONS)}>
  AI 优化
</Button>
```

### 4. 服务端权限检查

```typescript
// API 路由中验证权限
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request)
  const user = await getUserByShop(session.shop)
  const subscription = await getCurrentSubscription(user.id)
  const currentPlan = subscription?.planType || PlanType.FREE
  
  // 检查权限
  if (!hasFeatureAccess(currentPlan, Feature.API_ACCESS)) {
    return Response.json({
      success: false,
      error: "This feature requires Professional plan or higher"
    }, { status: 403 })
  }
  
  // 执行操作...
}
```

### 5. 显示升级提示而不是隐藏功能

```typescript
// ✅ 推荐：显示功能但禁用，引导升级
<RestrictedButton feature={Feature.BULK_TOOLS} showBadge={true}>
  批量优化
</RestrictedButton>

// ❌ 不推荐：完全隐藏功能
<FeatureGate feature={Feature.BULK_TOOLS}>
  <Button>批量优化</Button>
</FeatureGate>
```

---

## 完整示例：功能页面

```typescript
import { Page, Card, BlockStack, Button } from "@shopify/polaris"
import { usePermission } from "~/hooks/usePermission"
import { RestrictedButton, FeatureGate } from "~/components/FeatureGate"
import { Feature } from "~/config/permissions"

export default function OptimizationPage() {
  const { hasAccess, isProfessional } = usePermission()
  
  return (
    <Page title="SEO 优化">
      <BlockStack gap="400">
        {/* 基础功能：所有用户可用 */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">基础优化</Text>
            <Button onClick={handleManualOptimize}>
              手动优化
            </Button>
          </BlockStack>
        </Card>
        
        {/* Professional 功能：受限按钮 */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">AI 优化</Text>
            <RestrictedButton
              feature={Feature.AI_SUGGESTIONS}
              onClick={handleAIOptimize}
              showBadge={true}
            >
              AI 智能优化
            </RestrictedButton>
          </BlockStack>
        </Card>
        
        {/* Professional 功能：条件渲染 */}
        {isProfessional && (
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">批量工具</Text>
              <Button onClick={handleBulkOptimize}>
                批量优化所有页面
              </Button>
            </BlockStack>
          </Card>
        )}
        
        {/* Enterprise 功能：显示升级提示 */}
        <FeatureGate
          feature={Feature.API_ACCESS}
          showUpgradeBanner={true}
        >
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">API 访问</Text>
              <TextField label="API Key" value="sk-..." />
            </BlockStack>
          </Card>
        </FeatureGate>
      </BlockStack>
    </Page>
  )
}
```

---

## 总结

✅ **使用 `usePermission` Hook** - 简化权限检查  
✅ **使用 `RestrictedButton`** - 自动处理禁用和升级引导  
✅ **使用 `FeatureGate`** - 控制功能显示/隐藏  
✅ **服务端验证** - 防止绕过前端限制  
✅ **显示而非隐藏** - 引导用户升级套餐  


