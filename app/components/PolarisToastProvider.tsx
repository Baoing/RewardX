import { useState, useEffect, useCallback } from "react"
import { Frame, Toast as PolarisToast } from "@shopify/polaris"

type ToastMessage = {
  content: string
  error?: boolean
  duration?: number
}

/**
 * Polaris Toast Provider
 * 
 * 用于非 Shopify App Bridge 环境（如独立后台）
 * 监听 showToast 事件并显示 Polaris Toast
 */
export function PolarisToastProvider({ children }: { children: React.ReactNode }) {
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null)

  const handleShowToast = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<ToastMessage>
    setToastMessage(customEvent.detail)

    // 自动隐藏
    const duration = customEvent.detail.duration || 3000
    setTimeout(() => {
      setToastMessage(null)
    }, duration)
  }, [])

  useEffect(() => {
    // 监听自定义 showToast 事件
    window.addEventListener("showToast", handleShowToast)

    return () => {
      window.removeEventListener("showToast", handleShowToast)
    }
  }, [handleShowToast])

  const toastMarkup = toastMessage ? (
    <PolarisToast
      content={toastMessage.content}
      error={toastMessage.error}
      onDismiss={() => setToastMessage(null)}
    />
  ) : null

  return (
    <>
      {children}
      {toastMarkup}
    </>
  )
}


