import { Text } from "@shopify/polaris"
import { useEffect, useMemo, useRef, useState } from "react"
import styles from "./SwitchTab.module.css"

type RadioOption = {
  value: string
  label: string
}

type SwitchTabProps = {
  className?: string
  options: Array<RadioOption>
  value: string
  onChange: (value: string) => void
}

export function SwitchTab(props: SwitchTabProps) {
  const {
    className = "",
    options,
    value,
    onChange
  } = props

  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [bgWidth, setBgWidth] = useState(0)

  // 计算背景块宽度
  useEffect(() => {
    itemRefs.current = new Array(options.length).fill(null)
      .map((_, index) => itemRefs.current[index] || null)

    if (options.length) {
      let target: HTMLDivElement | null = null

      options.forEach((item, index) => {
        if (item.value === value) {
          target = itemRefs.current[index]
        }
      })

      if (target) {
        // @ts-ignore
        setBgWidth(target.clientWidth)
      }
    }
  }, [options, value])

  // 计算背景块偏移量
  const bgOffset = useMemo(() => {
    const index = options.findIndex((item) => item.value === value)

    if (index !== -1) {
      let offset = 0

      for (let i = 0; i < index; i++) {
        offset += itemRefs.current[i]?.clientWidth ?? 0
        if (offset !== 0) offset += 4 // gap
      }
      return offset
    }
    return 0
  }, [value, options])

  return (
    <div className={`${styles.switchTabWrapper} ${className}`}>
      <div className={styles.switchTabBorder}>
        <div className={styles.switchTabContainer}>
          {/* 背景滑块 */}
          <div className={styles.switchTabBgWrapper}>
            {!!bgWidth && (
              <div
                className={styles.switchTabBg}
                style={{
                  width: `${bgWidth}px`,
                  transform: `translateX(${bgOffset}px)`
                }}
              />
            )}
          </div>

          {/* 选项 */}
          {options.map((option, index) => {
            const isActive = value === option.value
            return (
              <div
                key={option.value}
                ref={(el) => (itemRefs.current[index] = el)}
                onClick={() => onChange(option.value)}
                className={`${styles.switchTabItem} ${isActive ? styles.active : ""}`}
              >
                <Text as="span" variant="bodyMd" fontWeight="medium">
                  {option.label}
                </Text>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
