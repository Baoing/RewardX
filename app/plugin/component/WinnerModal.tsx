import { useState } from "react"
import type { Prize } from "@plugin/main"

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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          position: "relative",
          animation: "fadeIn 0.3s ease-in-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#666",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0f0f0"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          ×
        </button>

        {/* 中奖标题 */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#333",
              margin: "0 0 8px 0"
            }}
          >
            🎉 Congratulations!
          </h2>
          <p style={{ fontSize: "16px", color: "#666", margin: 0 }}>
            You won a prize!
          </p>
        </div>

        {/* 奖品图片 */}
        {prize.image && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "24px",
              marginLeft: "auto",
              marginRight: "auto"
            }}
          >
            <img
              src={prize.image}
              alt={prize.name}
              style={{
                margin: "auto",
                maxWidth: "200px",
                maxHeight: "200px",
                width: "auto",
                height: "auto",
                borderRadius: "8px",
                objectFit: "contain"
              }}
            />
          </div>
        )}

        {/* 奖品名称 */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "22px",
              fontWeight: "600",
              color: "#333",
              margin: "0 0 12px 0"
            }}
          >
            {prize.name}
          </h3>
          {/* 显示奖品类型标签 */}
          {prize.type && prize.type !== "no_prize" && (
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                backgroundColor: "#e8f5e9",
                color: "#2e7d32",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "500"
              }}
            >
              {prize.type === "discount_percentage" && `${prize.discountValue}% OFF`}
              {prize.type === "discount_fixed" && `$${prize.discountValue} OFF`}
              {prize.type === "free_shipping" && "Free Shipping"}
              {prize.type === "free_gift" && "Free Gift"}
            </div>
          )}
        </div>

        {/* 折扣码 */}
        {prize.discountCode && (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px"
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#666",
                marginBottom: "8px",
                fontWeight: "500"
              }}
            >
              Discount Code:
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#333",
                  backgroundColor: "#ffffff",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0",
                  fontFamily: "monospace",
                  letterSpacing: "2px"
                }}
              >
                {prize.discountCode}
              </code>
              <button
                onClick={handleCopyDiscountCode}
                style={{
                  padding: "10px 20px",
                  backgroundColor: copied ? "#28a745" : "#007bff",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => {
                  if (!copied) {
                    e.currentTarget.style.backgroundColor = "#0056b3"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copied) {
                    e.currentTarget.style.backgroundColor = "#007bff"
                  }
                }}
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* 过期时间 */}
        {expiresDate && (
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              textAlign: "center",
              marginBottom: "16px"
            }}
          >
            Valid until: {expiresDate}
          </div>
        )}
        {/* 样式动画 */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

