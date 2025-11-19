/**
 * CustomCssEditor 使用示例
 * 
 * 这个文件仅供参考，不会被编译到生产环境
 */

import { useState } from "react"
import { BlockStack, Text, Button } from "@shopify/polaris"
import CustomCssEditor from "./CustomCssEditor"

// ============ 示例 1: 基础使用 ============

export const Example1_BasicUsage = () => {
  const [css, setCss] = useState("")

  return (
    <CustomCssEditor
      value={css}
      onChange={(value) => setCss(value)}
    />
  )
}

// ============ 示例 2: 自定义高度 ============

export const Example2_CustomHeight = () => {
  const [css, setCss] = useState("")

  return (
    <CustomCssEditor
      value={css}
      onChange={(value) => setCss(value)}
      height="400px"
    />
  )
}

// ============ 示例 3: 带初始值 ============

export const Example3_WithInitialValue = () => {
  const [css, setCss] = useState(`
.game-container {
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.game-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
  `.trim())

  return (
    <CustomCssEditor
      value={css}
      onChange={(value) => setCss(value)}
    />
  )
}

// ============ 示例 4: 只读模式 ============

export const Example4_ReadOnly = () => {
  const css = `
/* This is read-only CSS */
.example {
  color: red;
}
  `.trim()

  return (
    <CustomCssEditor
      value={css}
      editable={false}
    />
  )
}

// ============ 示例 5: 与 Polaris 组件配合 ============

export const Example5_WithPolaris = () => {
  const [css, setCss] = useState("")
  const [isSaved, setIsSaved] = useState(true)

  const handleChange = (value: string) => {
    setCss(value)
    setIsSaved(false)
  }

  const handleSave = () => {
    console.log("Saving CSS:", css)
    setIsSaved(true)
  }

  const handleReset = () => {
    setCss("")
    setIsSaved(true)
  }

  return (
    <BlockStack gap="400">
      <div>
        <Text as="h3" variant="headingSm">
          Custom CSS
        </Text>
        <Text as="p" tone="subdued" variant="bodySm">
          Add CSS codes here to do some custom change
        </Text>
      </div>

      <CustomCssEditor
        value={css}
        onChange={handleChange}
        height="300px"
      />

      <div style={{ display: "flex", gap: "12px" }}>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaved}
        >
          Save CSS
        </Button>
        <Button onClick={handleReset}>
          Reset
        </Button>
      </div>

      {!isSaved && (
        <Text as="p" tone="caution" variant="bodySm">
          You have unsaved changes
        </Text>
      )}
    </BlockStack>
  )
}

// ============ 示例 6: 实时预览 ============

export const Example6_LivePreview = () => {
  const [css, setCss] = useState(`
.preview-box {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  text-align: center;
}
  `.trim())

  return (
    <BlockStack gap="400">
      <div>
        <Text as="h3" variant="headingSm">
          CSS Editor
        </Text>
        <CustomCssEditor
          value={css}
          onChange={(value) => setCss(value)}
          height="200px"
        />
      </div>

      <div>
        <Text as="h3" variant="headingSm">
          Live Preview
        </Text>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="preview-box">
          <Text as="p" variant="bodyLg">
            This is a live preview!
          </Text>
        </div>
      </div>
    </BlockStack>
  )
}

// ============ 示例 7: 自定义占位符 ============

export const Example7_CustomPlaceholder = () => {
  const [css, setCss] = useState("")

  return (
    <CustomCssEditor
      value={css}
      onChange={(value) => setCss(value)}
      placeholder="/* Enter your custom styles here... */"
    />
  )
}

// ============ 示例 8: 在 Modal 中使用 ============

export const Example8_InModal = () => {
  const [css, setCss] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        Open CSS Editor
      </Button>

      {/* 注意：这里简化了 Modal 的实现，实际使用时需要引入 Polaris Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          zIndex: 1000,
          width: "80%",
          maxWidth: "800px"
        }}>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">
              Edit CSS
            </Text>

            <CustomCssEditor
              value={css}
              onChange={(value) => setCss(value)}
              height="400px"
            />

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Button onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  console.log("Saving:", css)
                  setModalOpen(false)
                }}
              >
                Save
              </Button>
            </div>
          </BlockStack>
        </div>
      )}
    </>
  )
}

