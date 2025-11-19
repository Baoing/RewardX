import {
  ColorPicker as PolarisColorPicker,
  HSBAColor,
  hsbToHex,
  Popover,
  rgbToHsb,
  Text,
  TextField
} from "@shopify/polaris"
import { useCallback, useEffect, useState } from "react"
import styles from "./ColorPicker.module.scss"

export interface ColorPickerProps {
  color?: string
  placeholder?: string
  label?: string
  disabled?: boolean
  id?: string
  allowEmpty?: boolean // 是否允许无色
  onChange(color: string | undefined, id?: string): void
  onClickActivator?(id?: string): void
}

/**
 * 颜色选择器组件
 * 支持 HEX 颜色输入和可视化选择
 */
export const ColorPicker = ({
  color,
  placeholder,
  label,
  id,
  onChange,
  onClickActivator,
  disabled,
  allowEmpty = true
}: ColorPickerProps) => {
  const [active, setActive] = useState<boolean>(false)
  const [hexColor, setHexColor] = useState<string>("")

  const [pickerColor, setPickerColor] = useState<HSBAColor>({
    brightness: 1,
    hue: 120,
    saturation: 1,
    alpha: 1
  })

  /** 监听 color 值从外部修改 */
  useEffect(() => {
    // 如果 color 为空或 undefined
    if (!color || color === "") {
      // 如果有 placeholder 且 placeholder 是颜色值（以 # 开头），则使用 placeholder
      if (placeholder && placeholder.startsWith("#")) {
        const placeholderColor = placeholder.toLocaleUpperCase().replace("#", "")
        const { red, green, blue } = hexToRgb(`#${placeholderColor}`)
        
        if (!isNaN(red) && !isNaN(green) && !isNaN(blue)) {
          setPickerColor({ ...rgbToHsb({ blue, green, red }), alpha: 1 })
          setHexColor(placeholderColor)
          return
        }
      }
      
      // 否则设置为空
      setHexColor("")
      return
    }

    const _color = color.toLocaleUpperCase().replace("#", "")

    const { red, green, blue } = hexToRgb(`#${_color}`)

    if (isNaN(red) || isNaN(green) || isNaN(blue)) {
      return
    }

    setPickerColor({ ...rgbToHsb({ blue, green, red }), alpha: 1 })
    setHexColor(_color)
  }, [color, placeholder])

  const togglePopoverActive = useCallback(
    () => {
      if (!disabled) {
        setActive((popoverActive) => !popoverActive)
      }
    },
    [disabled]
  )

  const handleColorPickerChange = (HSBA: HSBAColor) => {
    setPickerColor(HSBA)
    const hex = hsbToHex(HSBA)

    const prefHex = hex.toLocaleUpperCase().replace("#", "")

    setHexColor(prefHex)
    onChange(prefHex, id)
  }

  const handleColorInputChange = (value: string) => {
    const prefValue = value.toLocaleUpperCase().replace("#", "")

    // 允许清空
    if (!prefValue && allowEmpty) {
      setHexColor("")
      onChange(undefined, id)
      return
    }

    const { red, green, blue } = hexToRgb(`#${prefValue}`)

    setHexColor(prefValue)

    if (isNaN(red) || isNaN(green) || isNaN(blue)) {
      return
    }

    setPickerColor({ ...rgbToHsb({ blue, green, red }), alpha: 1 })
    onChange(prefValue, id)
  }

  // 清空颜色
  const handleClearColor = () => {
    setHexColor("")
    onChange(undefined, id)
    setActive(false)
  }

  // 判断是否为空（用户选择了清空）vs 使用默认值
  // color 为空 且 placeholder 不是颜色值 = 真正的空
  const isReallyEmpty = (!color || color === "") && (!placeholder || !placeholder.startsWith("#"))
  
  // 显示颜色：优先使用 color，否则使用 placeholder（如果是颜色）
  const displayColor = color || (placeholder?.startsWith("#") ? placeholder.replace("#", "") : "")

  const colorBlock = (
    <div
      className={`${styles.activator} ${isReallyEmpty ? styles.empty : ""}`}
      onClick={() => {
        togglePopoverActive()
        onClickActivator && onClickActivator(id)
      }}
      style={
        !isReallyEmpty && displayColor
          ? {
              backgroundColor: `#${displayColor}`
            }
          : undefined
      }
    >
      {isReallyEmpty && (
        <div className={styles.emptyIndicator}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="20" x2="20" y2="4" stroke="#999" strokeWidth="2" />
          </svg>
        </div>
      )}
    </div>
  )

  return (
    <div className={styles.colorPickerWrapper}>
      <Popover
        activator={colorBlock}
        active={active}
        onClose={togglePopoverActive}
        preferInputActivator={false}
        preferredAlignment="left"
      >
        <div className={styles.colorPickerPadding}>
          <PolarisColorPicker
            allowAlpha={false}
            color={pickerColor}
            onChange={handleColorPickerChange}
          />
          <div className="mt-2">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                className={`${styles.activatorSmall} ${isReallyEmpty ? styles.empty : ""}`}
                style={
                  !isReallyEmpty && displayColor
                    ? {
                        backgroundColor: `#${displayColor}`
                      }
                    : undefined
                }
              >
                {isReallyEmpty && (
                  <div className={styles.emptyIndicator}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <line x1="4" y1="20" x2="20" y2="4" stroke="#999" strokeWidth="2" />
                    </svg>
                  </div>
                )}
              </div>
              <TextField
                prefix="#"
                disabled={disabled}
                autoComplete="off"
                label={null}
                value={hexColor}
                onChange={handleColorInputChange}
                placeholder={placeholder?.replace("#", "") || "000000"}
              />
            </div>
          </div>
          {allowEmpty && color && (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleClearColor}
                className={styles.clearButton}
              >
                Clear Color
              </button>
            </div>
          )}
        </div>
      </Popover>
      
      <div className={styles.colorInfo}>
        {label && (
          <Text variant="bodyMd" as="span" fontWeight="medium">
            {label}
          </Text>
        )}
        {placeholder && (
          <Text variant="bodySm" as="span" tone="subdued">
            {color ? `#${color.replace("#", "")}` : (placeholder.startsWith("#") ? placeholder : placeholder)}
          </Text>
        )}
      </div>
    </div>
  )
}

/** 从 Polaris 源码中拷贝的，该函数没有被他们 export 出来 */
function hexToRgb(color: string) {
  if (color.length === 4) {
    const repeatHex = (hex1: number, hex2: number) =>
      color.slice(hex1, hex2).repeat(2)
    const red = parseInt(repeatHex(1, 2), 16)
    const green = parseInt(repeatHex(2, 3), 16)
    const blue = parseInt(repeatHex(3, 4), 16)

    return { blue, green, red }
  }

  const red = parseInt(color.slice(1, 3), 16)
  const green = parseInt(color.slice(3, 5), 16)
  const blue = parseInt(color.slice(5, 7), 16)

  return { blue, green, red }
}

export default ColorPicker

