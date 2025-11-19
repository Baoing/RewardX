# SetupGuide 新手引导组件

通用的新手引导组件，支持多步骤配置、进度跟踪、完成状态切换等功能。

## 功能特性

- ✅ 多步骤配置
- ✅ 进度条展示
- ✅ 展开/收起
- ✅ 完成状态切换
- ✅ 自定义内容和操作
- ✅ 响应式设计
- ✅ 国际化支持
- ✅ TypeScript 类型支持

## 快速开始

### 基础用法

```tsx
import { SetupGuide } from "~/components/SetupGuide"

export default function MyPage() {
  const steps = [
    {
      id: "step1",
      title: "第一步：配置基础信息",
      content: <div>这是第一步的内容</div>,
      isCompleted: false,
      onToggleComplete: async () => {
        await api.completeStep("step1")
      }
    },
    {
      id: "step2",
      title: "第二步：设置参数",
      content: <div>这是第二步的内容</div>,
      mediaNode: <img src="/guide-step2.png" alt="Step 2" />,
      isCompleted: false,
      onToggleComplete: async () => {
        await api.completeStep("step2")
      }
    }
  ]

  return (
    <SetupGuide
      title="快速设置指南"
      steps={steps}
      onDismiss={async () => {
        await api.dismissGuide()
      }}
    />
  )
}
```

### 完整示例

```tsx
import { SetupGuide, SetupGuideStep } from "~/components/SetupGuide"
import { useState } from "react"

export default function Dashboard() {
  const [steps, setSteps] = useState<SetupGuideStep[]>([
    {
      id: "add-tracking",
      title: "添加追踪页面",
      content: (
        <div>
          <p>创建一个追踪页面，让客户可以查询订单状态</p>
          <Button onClick={() => navigate("/tracking")}>去添加</Button>
        </div>
      ),
      mediaNode: <img src="/guide-tracking.svg" alt="Tracking Page" />,
      isCompleted: false,
      onToggleComplete: async () => {
        await api.completeStep("add-tracking")
        // 更新本地状态
        setSteps(prev =>
          prev.map(s =>
            s.id === "add-tracking" ? { ...s, isCompleted: true } : s
          )
        )
      }
    },
    {
      id: "customize-notifications",
      title: "自定义通知",
      content: (
        <div>
          <p>配置发货通知和订单更新提醒</p>
          <Button onClick={() => navigate("/settings/notifications")}>
            去设置
          </Button>
        </div>
      ),
      isCompleted: false,
      onToggleComplete: async () => {
        await api.completeStep("customize-notifications")
        setSteps(prev =>
          prev.map(s =>
            s.id === "customize-notifications"
              ? { ...s, isCompleted: true }
              : s
          )
        )
      }
    }
  ])

  const [visible, setVisible] = useState(true)

  return (
    <SetupGuide
      title="快速设置指南"
      steps={steps}
      visible={visible}
      defaultExpanded={true}
      onDismiss={async () => {
        await api.dismissGuide()
        setVisible(false)
      }}
      actions={[
        <LanguageSelector key="lang" />
      ]}
      topContent={
        <ReviewBanner onReview={handleReview} />
      }
      progressTemplate="{completed}/{total} 个任务已完成"
      completedText="🎉 所有任务都完成了！"
    />
  )
}
```

## API

### SetupGuide Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `title` | `string` | 否 | `"Quick Setup Guide"` | 引导标题 |
| `steps` | `SetupGuideStep[]` | 是 | - | 步骤列表 |
| `visible` | `boolean` | 否 | `true` | 是否显示引导 |
| `defaultExpanded` | `boolean` | 否 | 自动计算 | 初始展开状态 |
| `onDismiss` | `() => Promise<void> \| void` | 否 | - | 关闭引导的回调 |
| `actions` | `React.ReactNode[]` | 否 | `[]` | 自定义操作按钮 |
| `topContent` | `React.ReactNode` | 否 | - | 顶部自定义内容 |
| `completedText` | `string` | 否 | `"All tasks complete"` | 完成所有步骤后的提示文案 |
| `progressTemplate` | `string` | 否 | - | 进度文案模板 |

### SetupGuideStep

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 步骤唯一标识 |
| `title` | `React.ReactNode` | 是 | 步骤标题 |
| `content` | `React.ReactNode` | 否 | 步骤内容 |
| `mediaNode` | `React.ReactNode` | 否 | 媒体内容（图片/视频等） |
| `isCompleted` | `boolean` | 是 | 是否已完成 |
| `onToggleComplete` | `() => Promise<void> \| void` | 否 | 切换完成状态的回调 |

## 使用场景

### 1. Dashboard 新手引导

```tsx
<SetupGuide
  title="欢迎使用 RewardX"
  steps={[
    {
      id: "create-campaign",
      title: "创建你的第一个活动",
      content: <CreateCampaignGuide />,
      isCompleted: campaignCount > 0,
      onToggleComplete: markAsComplete
    },
    {
      id: "setup-rewards",
      title: "配置奖品规则",
      content: <RewardsGuide />,
      isCompleted: hasConfiguredRewards,
      onToggleComplete: markAsComplete
    }
  ]}
/>
```

### 2. 功能引导

```tsx
<SetupGuide
  title="设置订单抽奖"
  steps={[
    {
      id: "min-order",
      title: "设置最低订单金额",
      content: <MinOrderAmountInput />,
      isCompleted: minOrderAmount > 0
    },
    {
      id: "prizes",
      title: "配置奖品",
      content: <PrizeList />,
      isCompleted: prizes.length > 0
    }
  ]}
/>
```

### 3. 带评分引导

```tsx
<SetupGuide
  title="快速设置"
  steps={steps}
  topContent={
    completedCount === steps.length && (
      <ReviewBanner
        onRate={handleRate}
        onFeedback={handleFeedback}
      />
    )
  }
/>
```

## 样式定制

组件使用 CSS Modules，可以通过覆盖 CSS 变量来定制样式：

```css
:root {
  --p-color-bg-surface-hover: #f6f6f7;
  --p-color-bg-surface-active: #f1f1f1;
  --p-color-icon-secondary: #8c8c8c;
  --p-border-radius-200: 8px;
  --p-space-200: 8px;
}
```

## 国际化

组件内置支持 `react-i18next`，使用以下翻译键：

- `"Quick Setup Guide"` - 默认标题
- `"{completed} of {total} tasks complete"` - 进度文案
- `"All tasks complete"` - 完成文案
- `"Mark as done"` - 标记为完成
- `"Mark as not done"` - 标记为未完成
- `"Dismiss"` - 关闭

## 最佳实践

1. **步骤 ID 要唯一**：确保每个步骤的 `id` 是唯一的，用于状态追踪
2. **异步操作要处理错误**：`onToggleComplete` 如果失败要有错误提示
3. **状态同步**：完成步骤后要同步更新 `isCompleted` 状态
4. **响应式设计**：步骤内容要考虑移动端适配
5. **合理的步骤数量**：建议 3-5 个步骤，太多会影响用户体验

## 注意事项

- 组件依赖 Shopify Polaris，确保已正确安装和配置
- 需要 `react-i18next` 支持国际化
- 使用 CSS Modules，样式类名会被自动处理
- `onToggleComplete` 和 `onDismiss` 可以是异步函数，组件会自动处理 loading 状态

## License

MIT

