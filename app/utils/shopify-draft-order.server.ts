/**
 * Shopify Draft Order 工具函数
 * 用于创建草稿订单（Draft Order），用于免费赠品自动发货
 */

interface CreateDraftOrderParams {
  customerId?: string // Shopify 客户 ID
  email?: string // 客户邮箱
  lineItems: Array<{
    productId: string // 产品 ID
    variantId?: string // 变体 ID（可选）
    quantity: number // 数量
  }>
  shippingAddress?: {
    firstName?: string
    lastName?: string
    address1?: string
    address2?: string
    city?: string
    province?: string
    country?: string
    zip?: string
    phone?: string
  }
  note?: string // 订单备注
  tags?: string[] // 订单标签
}

interface DraftOrderResult {
  draftOrderId: string
  invoiceUrl?: string
}

/**
 * 创建 Shopify Draft Order（草稿订单）
 * 用于免费赠品自动发货
 */
export async function createDraftOrder(
  admin: any,
  params: CreateDraftOrderParams
): Promise<DraftOrderResult> {
  const {
    customerId,
    email,
    lineItems,
    shippingAddress,
    note,
    tags
  } = params

  // 构建 line items
  const draftOrderLineItems = lineItems.map(item => ({
    productId: item.productId,
    variantId: item.variantId || null,
    quantity: item.quantity
  }))

  // 构建 shipping address
  let shippingAddressInput: any = null
  if (shippingAddress) {
    shippingAddressInput = {
      firstName: shippingAddress.firstName || "",
      lastName: shippingAddress.lastName || "",
      address1: shippingAddress.address1 || "",
      address2: shippingAddress.address2 || null,
      city: shippingAddress.city || "",
      province: shippingAddress.province || null,
      country: shippingAddress.country || "US",
      zip: shippingAddress.zip || "",
      phone: shippingAddress.phone || null
    }
  }

  const mutation = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          invoiceUrl
          order {
            id
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const variables: any = {
    input: {
      lineItems: draftOrderLineItems,
      useCustomerDefaultAddress: !shippingAddress && !!customerId
    }
  }

  // 如果有客户 ID，添加到输入
  if (customerId) {
    variables.input.customerId = customerId
  }

  // 如果有邮箱但没有客户 ID，尝试通过邮箱查找客户
  if (email && !customerId) {
    // 先尝试查找客户
    try {
      const customerQuery = `
        query getCustomerByEmail($email: String!) {
          customers(first: 1, query: $email) {
            edges {
              node {
                id
              }
            }
          }
        }
      `
      const customerResponse = await admin.graphql(customerQuery, {
        variables: { email: `email:${email}` }
      })
      const customerData: any = await customerResponse.json()
      const customer = customerData.data?.customers?.edges?.[0]?.node
      if (customer) {
        variables.input.customerId = customer.id
      } else {
        // 如果没有找到客户，使用邮箱创建
        variables.input.email = email
      }
    } catch (error) {
      console.warn("⚠️ 查找客户失败，使用邮箱创建:", error)
      variables.input.email = email
    }
  }

  // 添加收货地址
  if (shippingAddressInput) {
    variables.input.shippingAddress = shippingAddressInput
  }

  // 添加备注
  if (note) {
    variables.input.note = note
  }

  // 添加标签
  if (tags && tags.length > 0) {
    variables.input.tags = tags
  }

  try {
    const response = await admin.graphql(mutation, {
      variables
    })

    const data: any = await response.json()

    if (data.errors) {
      console.error("❌ Shopify GraphQL 错误:", data.errors)
      throw new Error(`Failed to create draft order: ${data.errors[0]?.message || "Unknown error"}`)
    }

    const draftOrder = data.data?.draftOrderCreate?.draftOrder
    const userErrors = data.data?.draftOrderCreate?.userErrors

    if (userErrors && userErrors.length > 0) {
      console.error("❌ Shopify 用户错误:", userErrors)
      throw new Error(`Failed to create draft order: ${userErrors[0]?.message || "Unknown error"}`)
    }

    if (!draftOrder) {
      throw new Error("Failed to create draft order: No draft order returned")
    }

    console.log("✅ Shopify Draft Order 创建成功:", {
      draftOrderId: draftOrder.id,
      invoiceUrl: draftOrder.invoiceUrl
    })

    return {
      draftOrderId: draftOrder.id,
      invoiceUrl: draftOrder.invoiceUrl
    }
  } catch (error) {
    console.error("❌ 创建 Shopify Draft Order 失败:", error)
    throw error
  }
}

/**
 * 完成 Draft Order（转换为正式订单）
 */
export async function completeDraftOrder(
  admin: any,
  draftOrderId: string
): Promise<{ orderId: string }> {
  const mutation = `
    mutation draftOrderComplete($id: ID!) {
      draftOrderComplete(id: $id) {
        draftOrder {
          id
          order {
            id
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const response = await admin.graphql(mutation, {
      variables: { id: draftOrderId }
    })

    const data: any = await response.json()

    if (data.errors) {
      console.error("❌ Shopify GraphQL 错误:", data.errors)
      throw new Error(`Failed to complete draft order: ${data.errors[0]?.message || "Unknown error"}`)
    }

    const draftOrder = data.data?.draftOrderComplete?.draftOrder
    const userErrors = data.data?.draftOrderComplete?.userErrors

    if (userErrors && userErrors.length > 0) {
      console.error("❌ Shopify 用户错误:", userErrors)
      throw new Error(`Failed to complete draft order: ${userErrors[0]?.message || "Unknown error"}`)
    }

    if (!draftOrder?.order?.id) {
      throw new Error("Failed to complete draft order: No order ID returned")
    }

    console.log("✅ Draft Order 完成，订单 ID:", draftOrder.order.id)

    return {
      orderId: draftOrder.order.id
    }
  } catch (error) {
    console.error("❌ 完成 Draft Order 失败:", error)
    throw error
  }
}

