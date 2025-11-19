# SetupGuide 集成指南

## ✅ 首页集成示例已完成

在首页（`app/routes/_app._index/route.tsx`）已经集成了一个完整的 SetupGuide 示例。

## 📸 效果预览

首页现在展示了一个 4 步新手引导：
1. ✨ 创建你的第一个抽奖活动
2. 🎁 配置奖品和规则
3. 🎨 自定义活动样式
4. 🚀 发布你的活动

## 🎯 如何使用

### 1. 启动项目查看效果

```bash
npm run dev
```

访问首页即可看到新手引导组件。

### 2. 核心代码说明

```tsx
// 定义步骤
const [steps, setSteps] = useState<SetupGuideStep[]>([
  {
    id: "create-campaign",
    title: "创建第一个活动",
    content: <YourContent />,
    mediaNode: <img src="..." />,
    isCompleted: false
  }
])

// 使用组件
<SetupGuide
  title="快速开始指南"
  steps={stepsWithHandlers}
  visible={guideVisible}
  onDismiss={handleDismissGuide}
/>
```

## 🔧 下一步优化建议

### 1. 持久化存储

当前步骤状态存储在 React state 中，刷新后会丢失。建议：

**方案 A：LocalStorage（简单）**

```tsx
// 保存到 localStorage
const handleToggleComplete = async (stepId: string) => {
  await api.markComplete(stepId)
  
  const newSteps = steps.map(s => 
    s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s
  )
  setSteps(newSteps)
  
  // 保存到 localStorage
  localStorage.setItem("setupGuideProgress", JSON.stringify(
    newSteps.map(s => ({ id: s.id, isCompleted: s.isCompleted }))
  ))
}

// 初始化时读取
useEffect(() => {
  const saved = localStorage.getItem("setupGuideProgress")
  if (saved) {
    const progress = JSON.parse(saved)
    setSteps(prev => prev.map(step => {
      const savedStep = progress.find(p => p.id === step.id)
      return savedStep ? { ...step, isCompleted: savedStep.isCompleted } : step
    }))
  }
}, [])
```

**方案 B：后端 API（推荐）**

```tsx
// 1. 创建 API 路由
// app/routes/api.setup-guide.ts
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)
  const formData = await request.formData()
  const stepId = formData.get("stepId")
  const isCompleted = formData.get("isCompleted") === "true"
  
  // 保存到数据库
  await prisma.setupGuideProgress.upsert({
    where: { userId_stepId: { userId: session.userId, stepId } },
    update: { isCompleted },
    create: { userId: session.userId, stepId, isCompleted }
  })
  
  return Response.json({ success: true })
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)
  
  const progress = await prisma.setupGuideProgress.findMany({
    where: { userId: session.userId }
  })
  
  return Response.json({ progress })
}

// 2. 在组件中调用
const { data } = useLoaderData<typeof loader>()

useEffect(() => {
  if (data?.progress) {
    setSteps(prev => prev.map(step => {
      const savedStep = data.progress.find(p => p.stepId === step.id)
      return savedStep ? { ...step, isCompleted: savedStep.isCompleted } : step
    }))
  }
}, [data])
```

### 2. 动态条件显示

根据用户实际完成的操作自动标记步骤：

```tsx
// 在 loader 中检查实际状态
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)
  
  // 检查是否创建了活动
  const campaignCount = await prisma.campaign.count({
    where: { userId: session.userId }
  })
  
  // 检查是否配置了奖品
  const hasConfiguredPrizes = await prisma.campaign.findFirst({
    where: { 
      userId: session.userId,
      prizes: { some: {} }
    }
  })
  
  return Response.json({
    actualProgress: {
      "create-campaign": campaignCount > 0,
      "setup-rewards": !!hasConfiguredPrizes,
      // ... 其他步骤
    }
  })
}

// 在组件中合并实际进度
useEffect(() => {
  if (data?.actualProgress) {
    setSteps(prev => prev.map(step => ({
      ...step,
      isCompleted: data.actualProgress[step.id] || step.isCompleted
    })))
  }
}, [data])
```

### 3. 完成后自动隐藏

```tsx
useEffect(() => {
  const allCompleted = steps.every(s => s.isCompleted)
  if (allCompleted) {
    // 3 秒后自动隐藏
    setTimeout(() => {
      handleDismissGuide()
    }, 3000)
  }
}, [steps])
```

### 4. 添加埋点统计

```tsx
const handleToggleComplete = async (stepId: string) => {
  await api.markComplete(stepId)
  
  // 发送埋点
  if (window.analytics) {
    window.analytics.track("Setup Step Completed", {
      stepId,
      stepName: steps.find(s => s.id === stepId)?.title,
      completedCount: steps.filter(s => s.isCompleted).length + 1,
      totalSteps: steps.length
    })
  }
  
  setSteps(prev => /*...*/)
}
```

## 🎨 自定义样式

### 修改主题颜色

在 `app/components/SetupGuide/SetupGuide.module.scss` 中修改：

```scss
.setupGuide {
  // 自定义悬停颜色
  --p-color-bg-surface-hover: #f0f8ff;
  --p-color-bg-surface-active: #e0f0ff;
}
```

### 修改图标

替换 `HoverCircle.tsx` 中的图标 SVG 代码。

## 📚 更多示例

查看以下文件获取更多使用示例：
- `app/components/SetupGuide/Example.tsx` - 完整功能示例
- `app/components/SetupGuide/README.md` - 详细文档

## 🐛 常见问题

### 1. 引导一直不显示？

检查 `guideVisible` 状态：
```tsx
console.log("Guide visible:", guideVisible)
```

### 2. 步骤点击无响应？

确保 `onToggleComplete` 回调已正确设置：
```tsx
const stepsWithHandlers = steps.map(step => ({
  ...step,
  onToggleComplete: () => handleToggleComplete(step.id)
}))
```

### 3. 翻译不生效？

确保已在 `app/i18n/locales/` 中添加了对应的翻译键。

## 🚀 性能优化

1. **使用 useMemo 缓存步骤数据**
```tsx
const stepsWithHandlers = useMemo(
  () => steps.map(step => ({
    ...step,
    onToggleComplete: () => handleToggleComplete(step.id)
  })),
  [steps]
)
```

2. **延迟加载媒体内容**
```tsx
mediaNode: (
  <img 
    src="..." 
    alt="..."
    loading="lazy"
  />
)
```

3. **条件渲染**
```tsx
// 只在新用户时显示
{isNewUser && guideVisible && <SetupGuide {...props} />}
```

## 📞 技术支持

如有问题，请查看：
- 组件文档：`app/components/SetupGuide/README.md`
- 项目规范：根目录 `.cursorrules`

