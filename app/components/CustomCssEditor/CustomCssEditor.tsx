import { css as LangCSS } from "@codemirror/lang-css"
import { oneDark } from "@codemirror/theme-one-dark"
import CodeMirror, { ReactCodeMirrorProps } from "@uiw/react-codemirror"
import styles from "./CustomCssEditor.module.scss"

interface CustomCssEditorProps extends Omit<ReactCodeMirrorProps, "extensions" | "theme"> {
  height?: string
}

/**
 * Custom CSS Code Editor
 * 基于 CodeMirror 的 CSS 编辑器组件
 * 
 * @param props - CodeMirror props
 * @returns CSS 编辑器组件
 */
const CustomCssEditor = ({
  height = "250px",
  placeholder = "/* Add your custom CSS here */",
  className,
  ...props
}: CustomCssEditorProps) => {
  return (
    <div className={`${styles.customCssEditor} ${className || ""}`}>
      <CodeMirror
        {...props}
        id="custom-css-editor"
        height={height}
        extensions={[LangCSS()]}
        theme={oneDark}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true
        }}
      />
    </div>
  )
}

export default CustomCssEditor

