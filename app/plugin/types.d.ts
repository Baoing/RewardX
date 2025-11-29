/**
 * 类型声明文件
 */

declare module "@lucky-canvas/react" {
  import { Component, RefObject } from "react"

  export interface LuckyGridProps {
    width?: string
    height?: string
    rows?: number
    cols?: number
    blocks?: Array<Record<string, any>>
    prizes?: Array<Record<string, any>>
    buttons?: Array<Record<string, any>>
    defaultStyle?: Record<string, any>
    defaultConfig?: Record<string, any>
    onStart?: () => void
    onEnd?: (prize: any) => void
  }

  export class LuckyGrid extends Component<LuckyGridProps> {
    play(): void
    stop(index: number): void
  }

  export default LuckyGrid
}

