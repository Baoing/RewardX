import classNames from "classnames"
import React from "react"

interface BlockMaskLayerProps {
  show: boolean
  children: React.ReactNode
  maskNode?: React.ReactNode
  className?: string | string[]
  style?: React.CSSProperties
}

const BlockMaskLayer = ({
  show,
  children,
  maskNode,
  className,
  style
}: BlockMaskLayerProps) => {
  return (
    <div className={classNames("relative", className)} style={style}>
      {children}
      {show && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          {maskNode}
        </div>
      )}
    </div>
  )
}

export default BlockMaskLayer

