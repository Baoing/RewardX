/**
 * 新手引导步骤配置
 */
export interface SetupGuideStep {
  /** 步骤唯一标识 */
  id: string
  /** 步骤标题 */
  title: React.ReactNode
  /** 步骤内容 */
  content?: React.ReactNode
  /** 媒体内容（图片/视频等） */
  mediaNode?: React.ReactNode
  /** 是否已完成 */
  isCompleted: boolean
  /** 切换完成状态的回调 */
  onToggleComplete?: () => Promise<void> | void
}

/**
 * 新手引导组件属性
 */
export interface SetupGuideProps {
  /** 引导标题 */
  title?: string
  /** 步骤列表 */
  steps: SetupGuideStep[]
  /** 是否显示引导（外部控制） */
  visible?: boolean
  /** 初始展开状态 */
  defaultExpanded?: boolean
  /** 关闭引导的回调 */
  onDismiss?: () => Promise<void> | void
  /** 自定义操作按钮（如语言切换等） */
  actions?: React.ReactNode[]
  /** 顶部自定义内容（如评分引导） */
  topContent?: React.ReactNode
  /** 完成所有步骤后的提示文案 */
  completedText?: string
  /** 进度文案模板，{completed} 和 {total} 会被替换 */
  progressTemplate?: string
}

/**
 * 步骤项属性
 */
export interface StepItemProps {
  /** 步骤配置 */
  step: SetupGuideStep
  /** 是否激活（展开） */
  active: boolean
  /** 是否正在切换完成状态 */
  loading?: boolean
  /** 点击标题的回调 */
  onTitleClick?: () => void
  /** 切换完成状态的回调 */
  onToggleComplete?: () => void
}

