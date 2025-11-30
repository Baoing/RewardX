import { useState } from "react"
import type { Prize } from "@plugin/main"
import styles from "./WinnerModal.module.scss"

interface WinnerModalProps {
  open: boolean
  onClose: () => void
  prize: Prize & {
    discountCode?: string | null
    expiresAt?: string | null
  }
}

/**
 * 中奖弹窗组件
 * 显示中奖奖品信息，包括图片、名称、折扣码等
 */
export const WinnerModal = ({ open, onClose, prize }: WinnerModalProps) => {
  const [copied, setCopied] = useState(false)

  if (!open) return null

  // 调试日志
  console.log("🎁 WinnerModal 渲染:", {
    open,
    prizeName: prize?.name,
    discountCode: prize?.discountCode,
    hasDiscountCode: !!prize?.discountCode
  })

  const handleCopyDiscountCode = async () => {
    if (!prize.discountCode) return

    try {
      await navigator.clipboard.writeText(prize.discountCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("❌ 复制失败:", error)
      // 降级方案：使用传统方法
      const textArea = document.createElement("textarea")
      textArea.value = prize.discountCode
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("❌ 复制失败:", err)
      }
      document.body.removeChild(textArea)
    }
  }

  // 格式化过期时间
  const formatExpiresAt = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null
    try {
      const date = new Date(expiresAt)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    } catch {
      return null
    }
  }

  const expiresDate = formatExpiresAt(prize.expiresAt || null)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        {/* 中奖标题 */}
        <div className={styles.header}>
          <h2 className={styles.title}>🎉 Congratulations!</h2>
          <p className={styles.subtitle}>You won a prize!</p>
        </div>

        {/* 奖品图片 */}
        {prize.image && (
          <div className={styles.imageContainer}>
            <img
              src={prize.image}
              alt={prize.name}
              className={styles.image}
            />
          </div>
        )}

        {/* 奖品名称 */}
        <div className={styles.prizeInfo}>
          <h3 className={styles.prizeName}>{prize.name}</h3>
          {/* 显示奖品类型标签 */}
          {prize.type && prize.type !== "no_prize" && (
            <div className={styles.typeBadge}>
              {prize.type === "discount_percentage" && `${prize.discountValue}% OFF`}
              {prize.type === "discount_fixed" && `$${prize.discountValue} OFF`}
              {prize.type === "free_shipping" && "Free Shipping"}
              {prize.type === "free_gift" && "Free Gift"}
            </div>
          )}
        </div>

        {/* 折扣码 */}
        {prize.discountCode && (
          <div className={styles.discountCodeContainer}>
            <div className={styles.discountCodeLabel}>Discount Code:</div>
            <div className={styles.discountCodeWrapper}>
              <code className={styles.discountCode}>{prize.discountCode}</code>
              <button
                onClick={handleCopyDiscountCode}
                className={`${styles.copyButton} ${copied ? styles.copied : ""}`}
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* 过期时间 */}
        {expiresDate && (
          <div className={styles.expiresDate}>Valid until: {expiresDate}</div>
        )}
      </div>
    </div>
  )
}

