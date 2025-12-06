/**
 * 获取商品列表 API
 * 用于商品选择器
 */

import { authenticate } from "../shopify.server"
import type { LoaderFunctionArgs } from "react-router"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request)

  try {
    const url = new URL(request.url)
    const query = url.searchParams.get("query") || ""
    const limit = parseInt(url.searchParams.get("limit") || "20", 10)

    const queryString = `#graphql
      query getProducts($query: String!, $first: Int!) {
        products(first: $first, query: $query) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
                altText
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    image {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const response = await admin.graphql(queryString, {
      variables: {
        query: query ? `title:*${query}*` : "",
        first: limit
      }
    })

    const data: any = await response.json()

    if (data.errors) {
      console.error("❌ 查询商品失败:", data.errors)
      return Response.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    const products = data.data?.products?.edges?.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      image: edge.node.featuredImage?.url,
      variants: edge.node.variants.edges.map((v: any) => ({
        id: v.node.id,
        title: v.node.title,
        price: v.node.price ? parseFloat(v.node.price).toFixed(2) : undefined
      }))
    })) || []

    return Response.json({ products })
  } catch (error) {
    console.error("❌ 获取商品列表异常:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

