import { Icon, Tooltip } from "@shopify/polaris"
import { ClipboardIcon } from "@shopify/polaris-icons"
import classNames from "classnames"
import { useTranslation } from "react-i18next"
import { showSuccessToast } from "@/utils/toast"
import styles from "./CopyField.module.scss"

interface CopyFieldProps {
  copyValue?: string
  children?: React.ReactNode | string
  toolTipText?: string
  config?: {
    reverse?: boolean
    hover?: boolean
  }
}

export default function CopyField({ copyValue, children, toolTipText, config }: CopyFieldProps) {
  const { t } = useTranslation()

  const handleCopyClick = () => {
    if (copyValue) {
      // 使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyValue).then(() => {
          showSuccessToast(t("common.copied", "Copied successfully"))
        }).catch(() => {
          // 降级方案
          fallbackCopy(copyValue)
        })
      } else {
        // 降级方案
        fallbackCopy(copyValue)
      }
    }
  }

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.opacity = "0"
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand("copy")
      showSuccessToast(t("common.copied", "Copied successfully"))
    } catch (err) {
      console.error("❌ 复制失败:", err)
    }
    document.body.removeChild(textArea)
  }

  return (
    <div className={classNames(
      "flex items-center cursor-pointer max-w-full",
      config?.reverse ? "flex-row-reverse" : "",
      config?.hover ? styles.hoverCopyFieldWrapper : "",
    )}>
      {copyValue ? (
        <div className={classNames("relative", styles.copyFieldIcon)} style={{ zIndex: 2 }}>
          <Tooltip content={toolTipText || t("common.copy", "Copy")} dismissOnMouseOut>
            <div onClick={handleCopyClick}>
              <Icon source={ClipboardIcon} tone="base" />
            </div>
          </Tooltip>
        </div>
      ) : null}
      {children || "-"}
    </div>
  )
}

