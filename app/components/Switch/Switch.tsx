import { Key } from "@shopify/polaris"
import classNames from "classnames"
import React from "react"

import styles from "./Switch.module.scss"


export type SwitchChangeEventHandler = (
  checked: boolean,
  event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
) => void;

interface SwitchProps
  extends Omit<React.HTMLAttributes<HTMLButtonElement>, "onChange" | "onClick"> {
  className?: string;
  prefixCls?: string;
  disabled?: boolean;
  // checkedChildren?: React.ReactNode;
  // unCheckedChildren?: React.ReactNode;
  onChange?: SwitchChangeEventHandler;
  tabIndex?: number;
  checked: boolean;
  // loadingIcon?: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
}

export function Switch({
  prefixCls = "rc-switch",
  className,
  checked,
  disabled,
  // loadingIcon,
  // checkedChildren,
  // unCheckedChildren,
  onChange,
  ...restProps
}: SwitchProps) {

  function triggerChange(
    newChecked: boolean,
    event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
  ) {
    if (!disabled) {
      onChange?.(newChecked, event)
    }
  }

  function onInternalKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.which === Key.LeftArrow && checked) {
      triggerChange(false, e)
    } else if (e.which === Key.RightArrow && !checked) {
      triggerChange(true, e)
    }
  }

  function onInternalClick(e: React.MouseEvent<HTMLButtonElement>) {
    triggerChange(!checked, e)
  }

  const switchClassName = classNames(
    styles[prefixCls],
    checked && styles[`${prefixCls}-checked`],
    disabled && styles[`${prefixCls}-disabled`],
    className,
  )

  return (
    <button
      {...restProps}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={switchClassName}
      onKeyDown={onInternalKeyDown}
      onClick={onInternalClick}
    >
      {/* { loadingIcon }*/}
      {/* <span className={ styles[`${ prefixCls }-inner`] }>*/}
      {/*  { checked ? checkedChildren : unCheckedChildren }*/}
      {/* </span>*/}
    </button>
  )
}
