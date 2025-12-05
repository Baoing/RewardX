/**
 * 手动注册 Webhook
 * POST /api/webhooks/register
 * 
 * 用于手动注册订单 webhook（如果自动注册失败）
 */

import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import { jsonWithCors, errorResponseWithCors } from "@/utils/api.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request)

    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL
    if (!appUrl) {
      return errorResponseWithCors("APP_URL not configured", 500, request, true)
    }

    const webhookUrl = `${appUrl}/webhooks/orders`

    // 注册 orders/create webhook
    const createResponse = await admin.graphql(
      `#graphql
      mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id
            callbackUrl
            topic
            apiVersion {
              name
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          topic: "ORDERS_CREATE",
          webhookSubscription: {
            callbackUrl: webhookUrl,
            format: "JSON"
          }
        }
      }
    )

    const createData: any = await createResponse.json()

    // 注册 orders/updated webhook
    const updateResponse = await admin.graphql(
      `#graphql
      mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id
            callbackUrl
            topic
            apiVersion {
              name
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          topic: "ORDERS_UPDATED",
          webhookSubscription: {
            callbackUrl: webhookUrl,
            format: "JSON"
          }
        }
      }
    )

    const updateData: any = await updateResponse.json()

    return jsonWithCors(
      {
        success: true,
        shop: session.shop,
        webhookUrl,
        createWebhook: createData.data?.webhookSubscriptionCreate?.webhookSubscription || null,
        createErrors: createData.data?.webhookSubscriptionCreate?.userErrors || [],
        updateWebhook: updateData.data?.webhookSubscriptionCreate?.webhookSubscription || null,
        updateErrors: updateData.data?.webhookSubscriptionCreate?.userErrors || [],
        createResponse: createData,
        updateResponse: updateData
      },
      undefined,
      request,
      true
    )
  } catch (error) {
    console.error("❌ Failed to register webhooks:", error)
    return errorResponseWithCors(
      error instanceof Error ? error.message : "Unknown error",
      500,
      request,
      true
    )
  }
}

