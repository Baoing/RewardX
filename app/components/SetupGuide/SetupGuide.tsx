import { ActionList, Button, Icon, LegacyCard, Popover, ProgressBar, Text } from "@shopify/polaris"
import { ChevronDownIcon, ChevronUpIcon, MenuHorizontalIcon, XIcon } from "@shopify/polaris-icons"
import classNames from "classnames"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { StepItem } from "./StepItem"
import styles from "./SetupGuide.module.scss"
import { SetupGuideProps } from "./types"

/**
 * 新手引导组件
 *
 * @example
 * ```tsx
 * <SetupGuide
 *   title="Quick Setup Guide"
 *   steps={[
 *     {
 *       id: "step1",
 *       title: "Step 1",
 *       content: <div>Step 1 content</div>,
 *       isCompleted: false,
 *       onToggleComplete: async () => { await api.complete("step1") }
 *     }
 *   ]}
 *   onDismiss={async () => { await api.dismiss() }}
 * />
 * ```
 */
export const SetupGuide = ({
  title,
  steps,
  visible = true,
  defaultExpanded,
  onDismiss,
  actions = [],
  topContent,
  completedText,
  progressTemplate
}: SetupGuideProps) => {
  const { t } = useTranslation("common")

  // 计算未完成的第一个步骤索引
  const firstIncompleteIndex = useMemo(
    () => steps.findIndex(step => !step.isCompleted),
    [steps]
  )

  // 展开/收起状态
  const [expanded, setExpanded] = useState(
    defaultExpanded !== undefined ? defaultExpanded : firstIncompleteIndex !== -1
  )

  // 当前激活的步骤
  const [activeStep, setActiveStep] = useState(
    firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex
  )

  // Dismiss Popover 状态
  const [dismissPopoverActive, setDismissPopoverActive] = useState(false)

  // 计算进度
  const completedCount = useMemo(
    () => steps.filter(step => step.isCompleted).length,
    [steps]
  )
  const progress = (completedCount / steps.length) * 100

  // 处理 Dismiss
  const handleDismiss = useCallback(async () => {
    if (onDismiss) {
      await onDismiss()
    }
    setDismissPopoverActive(false)
  }, [onDismiss])

  // 如果不可见，不渲染
  if (!visible) {
    return null
  }

  // 卡片标题
  const cardTitle = title || t("Quick Setup Guide", "快速设置指南")

  // 进度文案
  const progressText = progressTemplate
    ? progressTemplate
      .replace("{completed}", String(completedCount))
      .replace("{total}", String(steps.length))
    : t("{completed} of {total} tasks complete", "已完成 {completed}/{total} 个任务", {
      completed: completedCount,
      total: steps.length
    })

  // 完成文案
  const allCompletedText =
    completedText || t("All tasks complete", "所有任务已完成")

  return (
    <div
      className={classNames(
        styles.setupGuide,
        expanded && styles.expandSetupGuide
      )}
    >
      <LegacyCard
        title={<Text variant="headingMd" as="h2">{cardTitle}</Text>}
        roundedAbove="md"
        actions={[
          ...actions.map(action => ({
            content: action
          })),
          {
            content: (
              <Popover
                active={dismissPopoverActive}
                activator={
                  <Button
                    variant="tertiary"
                    icon={<Icon source={MenuHorizontalIcon} />}
                    onClick={() => setDismissPopoverActive(!dismissPopoverActive)}
                  />
                }
                onClose={() => setDismissPopoverActive(false)}
              >
                <ActionList
                  actionRole="menuitem"
                  items={[
                    {
                      content: t("Dismiss", "关闭"),
                      icon: XIcon,
                      onAction: handleDismiss
                    }
                  ]}
                />
              </Popover>
            )
          },
          {
            content: (
              <Button
                variant="tertiary"
                icon={<Icon source={expanded ? ChevronUpIcon : ChevronDownIcon} />}
                onClick={() => setExpanded(!expanded)}
              />
            )
          }
        ]}
      >
        {/* 顶部自定义内容（如评分引导） */}
        {topContent && <div className={styles.topContentWrapper}>{topContent}</div>}

        {/* 进度条 */}
        <LegacyCard.Section flush>
          {progress < 100 ? (
            <div className={styles.progressBar}>
              <div>{progressText}</div>
              <ProgressBar progress={progress} tone="success" />
            </div>
          ) : (
            <div className={styles.isDoneStatus}>
              <Icon source={CheckCircleIcon} tone="base" />
              {allCompletedText}
            </div>
          )}
        </LegacyCard.Section>

        {/* 步骤列表 */}
        {expanded && (
          <div className={styles.guideContentWrapper}>
            {steps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                active={activeStep === index}
                onTitleClick={() => setActiveStep(index)}
                onToggleComplete={step.onToggleComplete}
              />
            ))}
          </div>
        )}
      </LegacyCard>
    </div>
  )
}

// 用于完成状态的图标（在进度条中使用）
const CheckCircleIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <g clipPath="url(#clip0_check)">
        <path
          d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z"
          fill="#1A1A1A"
        />
        <path
          d="M15.2738 6.52629C15.6643 6.91682 15.6643 7.54998 15.2738 7.94051L9.4405 13.7738C9.05 14.1644 8.4168 14.1644 8.0263 13.7738L5.3596 11.1072C4.96908 10.7166 4.96908 10.0835 5.3596 9.693C5.75013 9.3024 6.38329 9.3024 6.77382 9.693L8.7334 11.6525L13.8596 6.52629C14.2501 6.13577 14.8833 6.13577 15.2738 6.52629Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_check">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

