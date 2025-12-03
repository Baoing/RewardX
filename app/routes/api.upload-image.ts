/**
 * 图片上传API端点
 * 使用Shopify的staged upload流程将图片上传到CDN
 */

import { authenticate } from "../shopify.server"
import type { ActionFunctionArgs } from "react-router"

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const { admin, session } = await authenticate.admin(request)

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "File must be an image" }, { status: 400 })
    }

    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return Response.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    console.log("📤 开始上传图片:", {
      filename: file.name,
      size: file.size,
      type: file.type
    })

    // Step 1: 创建staged upload target
    const stagedUploadMutation = `#graphql
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const stagedUploadResponse = await admin.graphql(stagedUploadMutation, {
      variables: {
        input: [
          {
            filename: file.name,
            mimeType: file.type,
            httpMethod: "POST",
            resource: "IMAGE"
          }
        ]
      }
    })

    const stagedUploadData: any = await stagedUploadResponse.json()

    if (stagedUploadData.errors) {
      console.error("❌ Staged upload创建失败:", stagedUploadData.errors)
      return Response.json(
        { error: stagedUploadData.errors[0]?.message || "Failed to create staged upload" },
        { status: 500 }
      )
    }

    const userErrors = stagedUploadData.data?.stagedUploadsCreate?.userErrors
    if (userErrors && userErrors.length > 0) {
      console.error("❌ Staged upload用户错误:", userErrors)
      return Response.json(
        { error: userErrors[0]?.message || "Failed to create staged upload" },
        { status: 400 }
      )
    }

    const stagedTarget = stagedUploadData.data?.stagedUploadsCreate?.stagedTargets?.[0]
    if (!stagedTarget) {
      return Response.json({ error: "Failed to create staged upload target" }, { status: 500 })
    }

    console.log("✅ Staged upload target创建成功:", stagedTarget.url)

    // Step 2: 上传文件到staged URL
    const uploadFormData = new FormData()
    
    // 添加所有参数
    stagedTarget.parameters.forEach((param: { name: string; value: string }) => {
      uploadFormData.append(param.name, param.value)
    })
    
    // 添加文件
    uploadFormData.append("file", file)

    const uploadResponse = await fetch(stagedTarget.url, {
      method: "POST",
      body: uploadFormData
    })

    if (!uploadResponse.ok) {
      console.error("❌ 文件上传失败:", uploadResponse.status, uploadResponse.statusText)
      return Response.json(
        { error: "Failed to upload file to staged URL" },
        { status: 500 }
      )
    }

    console.log("✅ 文件上传到staged URL成功")

    // Step 3: 使用resourceUrl创建文件记录
    const fileCreateMutation = `#graphql
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
            ... on MediaImage {
              image {
                url
                width
                height
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const fileCreateResponse = await admin.graphql(fileCreateMutation, {
      variables: {
        files: [
          {
            contentType: "IMAGE",
            originalSource: stagedTarget.resourceUrl,
            alt: file.name
          }
        ]
      }
    })

    const fileCreateData: any = await fileCreateResponse.json()

    if (fileCreateData.errors) {
      console.error("❌ 文件创建失败:", fileCreateData.errors)
      return Response.json(
        { error: fileCreateData.errors[0]?.message || "Failed to create file" },
        { status: 500 }
      )
    }

    const createUserErrors = fileCreateData.data?.fileCreate?.userErrors
    if (createUserErrors && createUserErrors.length > 0) {
      console.error("❌ 文件创建用户错误:", createUserErrors)
      return Response.json(
        { error: createUserErrors[0]?.message || "Failed to create file" },
        { status: 400 }
      )
    }

    const createdFile = fileCreateData.data?.fileCreate?.files?.[0]
    if (!createdFile) {
      return Response.json({ error: "Failed to create file" }, { status: 500 })
    }

    console.log("📊 文件创建结果:", {
      fileId: createdFile.id,
      fileStatus: createdFile.fileStatus,
      hasImage: !!createdFile.image
    })

    // 如果文件状态不是 READY，需要轮询获取 URL
    if (createdFile.fileStatus !== "READY") {
      console.log("⏳ 文件正在处理中，开始轮询...")
      
      // 轮询最多 10 次，每次等待 1 秒
      const maxAttempts = 10
      let attempts = 0
      let fileUrl: string | null = null
      let fileWidth: number | null = null
      let fileHeight: number | null = null

      while (attempts < maxAttempts && !fileUrl) {
        // 等待 1 秒
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++

        // 查询文件状态
        const fileQuery = `#graphql
          query getFile($id: ID!) {
            node(id: $id) {
              ... on MediaImage {
                id
                fileStatus
                image {
                  url
                  width
                  height
                }
              }
            }
          }
        `

        try {
          const queryResponse = await admin.graphql(fileQuery, {
            variables: {
              id: createdFile.id
            }
          })

          const queryData: any = await queryResponse.json()

          if (queryData.errors) {
            console.error("❌ 查询文件状态失败:", queryData.errors)
            break
          }

          const fileNode = queryData.data?.node
          if (fileNode) {
            console.log(`📊 轮询尝试 ${attempts}/${maxAttempts}:`, {
              fileStatus: fileNode.fileStatus,
              hasUrl: !!fileNode.image?.url
            })

            if (fileNode.fileStatus === "READY" && fileNode.image?.url) {
              fileUrl = fileNode.image.url
              fileWidth = fileNode.image.width
              fileHeight = fileNode.image.height
              console.log("✅ 文件处理完成，获取到URL:", fileUrl)
              break
            } else if (fileNode.fileStatus === "FAILED") {
              console.error("❌ 文件处理失败")
              return Response.json(
                { error: "File processing failed" },
                { status: 500 }
              )
            }
          }
        } catch (error) {
          console.error(`❌ 轮询尝试 ${attempts} 失败:`, error)
          // 继续尝试
        }
      }

      if (fileUrl) {
        console.log("✅ 图片上传成功（轮询后）:", fileUrl)
        return Response.json({
          success: true,
          url: fileUrl,
          fileId: createdFile.id,
          width: fileWidth,
          height: fileHeight
        })
      } else {
        // 如果轮询后仍然没有 URL，返回错误
        console.error("❌ 轮询超时，无法获取文件URL")
        return Response.json(
          {
            error: "File processing timeout. Please try again later.",
            fileId: createdFile.id,
            fileStatus: "PROCESSING"
          },
          { status: 500 }
        )
      }
    }

    // 如果文件状态是 READY，直接返回 URL
    const imageUrl = createdFile.image?.url

    if (!imageUrl) {
      console.error("❌ 文件状态为 READY 但没有 URL")
      return Response.json(
        { error: "File is ready but URL is not available" },
        { status: 500 }
      )
    }

    console.log("✅ 图片上传成功:", imageUrl)

    return Response.json({
      success: true,
      url: imageUrl,
      fileId: createdFile.id,
      width: createdFile.image?.width,
      height: createdFile.image?.height
    })
  } catch (error) {
    console.error("❌ 图片上传异常:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    )
  }
}

