import { Spinner } from "@shopify/polaris"
import classNames from "classnames"
import React from "react"
import BlockMaskLayer from "./BlockMaskLayer"

interface SpinnerContainerProps {
  loading: boolean
  children: React.ReactNode
  className?: string | string[]
  spinnerClassName?: string | string[]
  style?: React.CSSProperties
}

export function SpinnerContainer(props: SpinnerContainerProps) {
  const _classNames = props.className ?? []
  const _spinnerClassName = props.spinnerClassName ?? []
  const _styles = props.style || {}

  return (
    <BlockMaskLayer
      className={_classNames}
      show={props.loading}
      style={{ zIndex: 21, ..._styles }}
      maskNode={
        <div className={classNames(_spinnerClassName)}>
          <Spinner hasFocusableParent={false} />
        </div>
      }
    >
      {props.children}
    </BlockMaskLayer>
  )
}

