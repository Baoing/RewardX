/**
 * Toast 通知工具
 * 
 * 自动检测环境：
 * - Shopify App 环境：使用 App Bridge Toast
 * - 独立后台环境：使用 Polaris Toast
 */

export type ToastProps = {
  content: string
  error?: boolean
  duration?: number
}

/**
 * 显示 Toast 通知
 * 
 * @example
 * ```typescript
 * // 成功消息
 * showToast({ content: "保存成功" })
 * 
 * // 错误消息
 * showToast({ content: "保存失败", error: true })
 * 
 * // 自定义持续时间
 * showToast({ content: "复制成功", duration: 2000 })
 * ```
 */
export function showToast(props: ToastProps) {
  const { content, error = false, duration = 3000 } = props

  // 检测是否在 Shopify App Bridge 环境中
  if (typeof window !== "undefined" && window.shopify) {
    // 使用 App Bridge Toast
    try {
      window.shopify.toast.show(content, {
        duration,
        isError: error
      })
    } catch (e) {
      console.error("App Bridge Toast 调用失败，降级到浏览器通知:", e)
      fallbackToAlert(content)
    }
  } else {
    // 非 Shopify 环境：触发自定义事件，由 Polaris Toast 组件监听
    if (typeof window !== "undefined") {
      const event = new CustomEvent("showToast", {
        detail: { content, error, duration }
      })
      window.dispatchEvent(event)
    } else {
      // SSR 环境：静默处理
      console.log("[Toast SSR]:", content)
    }
  }
}

/**
 * 降级方案：使用浏览器 alert
 */
function fallbackToAlert(content: string) {
  if (typeof window !== "undefined") {
    alert(content)
  }
}

/**
 * 成功提示的快捷方法
 */
export function showSuccessToast(content: string) {
  showToast({ content, error: false })
}

/**
 * 错误提示的快捷方法
 */
export function showErrorToast(content: string) {
  showToast({ content, error: true })
}

// TypeScript 类型扩展
declare global {
  interface Window {
    shopify?: {
      toast: {
        show: (content: string, options?: { duration?: number; isError?: boolean }) => void
      }
    }
  }
}


