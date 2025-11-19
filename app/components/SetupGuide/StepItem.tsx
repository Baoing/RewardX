import { Icon, Spinner, Text, Tooltip } from "@shopify/polaris"
import classNames from "classnames"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { CheckCircleIcon, HoverCircle } from "./HoverCircle"
import styles from "./SetupGuide.module.scss"
import { StepItemProps } from "./types"

/**
 * 媒体遮罩层（渐变效果）
 */
const MediaMask = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.mediaWrapper}>
      <div className={styles.pictureWrapper}>
        {children}
        <div className={styles.pictureMask} />
      </div>
    </div>
  )
}

/**
 * 新手引导步骤项
 */
export const StepItem = ({
  step,
  active,
  onTitleClick,
  onToggleComplete
}: StepItemProps) => {
  const { t } = useTranslation("common")
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!onToggleComplete) return

    setLoading(true)
    try {
      await onToggleComplete()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={classNames(styles.stepWrapper, active && styles.active)}>
      {/* 步骤图标（完成/未完成） */}
      <div className={styles.stepIcon}>
        {loading ? (
          <div className={styles.iconWrapper}>
            <Spinner size="small" />
          </div>
        ) : (
          <Tooltip
            content={
              step.isCompleted
                ? t("Mark as not done", "标记为未完成")
                : t("Mark as done", "标记为完成")
            }
            dismissOnMouseOut
          >
            <div className={styles.iconWrapper} onClick={handleToggle}>
              {step.isCompleted ? <Icon source={CheckCircleIcon} /> : <HoverCircle />}
            </div>
          </Tooltip>
        )}
      </div>

      {/* 步骤内容 */}
      <div className={classNames(styles.content, active && styles.activeContent)}>
        <div className={styles.textContent}>
          {/* 步骤标题 */}
          <div
            className={classNames(
              styles.stepTitle,
              active && styles.activeStepTitle
            )}
            onClick={onTitleClick}
          >
            {active ? (
              <Text variant="headingSm" as="h6">
                {step.title}
              </Text>
            ) : (
              <Text variant="bodyMd" as="h6">
                {step.title}
              </Text>
            )}
          </div>

          {/* 步骤内容（仅在激活时显示） */}
          {active && step.content && (
            <div className={styles.desc}>{step.content}</div>
          )}
        </div>

        {/* 媒体内容（仅在激活时显示） */}
        {active && step.mediaNode && (
          <MediaMask>{step.mediaNode}</MediaMask>
        )}
      </div>
    </div>
  )
}

