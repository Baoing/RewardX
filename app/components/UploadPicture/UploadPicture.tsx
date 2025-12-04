import { Banner, Button, DropZone, LegacyStack, List, Thumbnail } from "@shopify/polaris"
import { NoteIcon } from "@shopify/polaris-icons"
import classNames from "classnames"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { SpinnerContainer } from "./SpinnerContainer"
import styles from "./index.module.scss"
import { showSuccessToast, showErrorToast } from "@/utils/toast"

interface UploadPictureProps {
  value?: string
  onChange: (url: string) => void
  removeText?: string
  limitSize?: number // 默认 2097152 (2MB)
  validImageTypes?: string[] // 默认 ["image/gif", "image/jpeg", "image/png"]
  acceptFileTypes?: string[] // 默认 [".jpg", ".png", ".gif", ".jpeg"]
}

const UploadPicture = ({
  value,
  removeText,
  onChange,
  limitSize = 2097152, // 2MB
  validImageTypes = ["image/gif", "image/jpeg", "image/png"],
  acceptFileTypes = [".jpg", ".png", ".gif", ".jpeg"]
}: UploadPictureProps) => {
  const { t } = useTranslation()
  const [rejectedFiles, setRejectedFiles] = useState<File[]>([])
  const [errorText, setErrorText] = useState<string>("")
  const [files, setFiles] = useState<File | undefined>(undefined)
  const [uploading, setUploading] = useState<boolean>(false)

  const hasError = rejectedFiles.length > 0

  // 处理上传图片事件
  const handleUploadImage = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    setRejectedFiles([])
    setErrorText("")

    try {
      const formData = new FormData()
      formData.append("file", acceptedFiles[0], acceptedFiles[0].name)

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData
      })

      // 检查响应状态
      if (!response.ok) {
        // 尝试解析错误响应
        let errorMessage = "Upload failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // 如果响应不是 JSON，使用状态文本
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // 解析成功响应
      const data = await response.json()

      // 检查响应数据
      if (!data.success) {
        throw new Error(data.error || "Upload failed")
      }

      // 检查是否有 URL
      if (!data.url) {
        // 如果文件正在处理中（轮询超时的情况）
        if (data.fileId) {
          throw new Error(
            data.message || t("uploadPicture.processing", "File is being processed. Please try again in a moment.")
          )
        }
        throw new Error("No URL returned from server")
      }

      // 上传成功
      onChange(data.url)
      showSuccessToast(t("uploadPicture.success", "Image uploaded successfully"))
      setFiles(undefined)
    } catch (error) {
      console.error("❌ 图片上传失败:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image"
      showErrorToast(errorMessage)
      setFiles(undefined)
    } finally {
      setUploading(false)
    }
  }, [onChange, t])

  const handleDropZoneDrop = useCallback(
    (_dropFiles: File[], acceptedFiles: File[], rejectedFiles: File[]) => {
      try {
        setRejectedFiles([])
        setErrorText("")

        if (acceptedFiles.length === 0) {
          return
        }

        const file = acceptedFiles[0]

        // 验证文件大小
        if (file.size > limitSize) {
          setErrorText(
            t("uploadPicture.errorText1", "File size should be less than {{size}}MB", {
              size: Math.round(limitSize / 1024 / 1024)
            })
          )
          setRejectedFiles([file])
          return
        }

        // 验证文件类型
        if (!validImageTypes.includes(file.type)) {
          setErrorText(
            t("uploadPicture.errorText2", "File type should be {{types}}", {
              types: acceptFileTypes.join(", ")
            })
          )
          setRejectedFiles([file])
          return
        }

        setFiles(file)
        handleUploadImage(acceptedFiles)
      } catch (error) {
        console.error("❌ 文件处理错误:", error)
        setErrorText(t("uploadPicture.errorText2", "File type should be {{types}}", { types: acceptFileTypes.join(", ") }))
        setRejectedFiles(rejectedFiles)
      }
    },
    [limitSize, validImageTypes, acceptFileTypes, handleUploadImage, t]
  )

  const handleRemoveFile = () => {
    setFiles(undefined)
    onChange("")
  }

  const errorMessage = hasError && (
    <div style={{ marginBottom: "1rem" }}>
      <Banner title={t("uploadPicture.errorTitle", "The following images couldn't be uploaded:")} tone="critical">
        <List type="bullet">
          {rejectedFiles.map((file, index) => (
            <List.Item key={index}>
              {`"${file.name}" is not supported. ${errorText}`}
            </List.Item>
          ))}
        </List>
      </Banner>
    </div>
  )

  const fileUpload = !files && (
    <DropZone.FileUpload
      actionHint={t("uploadPicture.acceptType", "Accepts {{types}}", {
        types: acceptFileTypes.join(", ")
      })}
    />
  )

  const uploadedFiles = files && (
    <div style={{ padding: "0" }}>
      <LegacyStack vertical>
        <LegacyStack alignment="center" distribution="center">
          <Thumbnail
            alt={files.name}
            size="large"
            source={
              validImageTypes.includes(files.type)
                ? window.URL.createObjectURL(files)
                : NoteIcon
            }
          />
        </LegacyStack>
      </LegacyStack>
    </div>
  )

  return (
    <>
      {value ? (
        <div className="flex items-center justify-between">
          <img className={classNames("mr-5", styles.imgContainer)} src={value} alt="" />
          <Button id="logo-upload-remove-button" onClick={handleRemoveFile}>
            {removeText || t("common.remove", "Remove")}
          </Button>
        </div>
      ) : (
        <SpinnerContainer loading={uploading}>
          {errorMessage}
          <DropZone
            onDrop={handleDropZoneDrop}
            accept={validImageTypes.join(",")}
            type="image"
            variableHeight
            allowMultiple={false}
          >
            {uploadedFiles}
            {fileUpload}
          </DropZone>
        </SpinnerContainer>
      )}
    </>
  )
}

export default UploadPicture

