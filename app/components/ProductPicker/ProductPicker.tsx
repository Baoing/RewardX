/**
 * Shopify 商品选择器组件
 * 使用 Modal 和商品搜索选择商品和变体
 */

import { useState, useCallback, useEffect } from "react"
import { Button, Text, BlockStack, InlineStack, Thumbnail, Select, Modal, TextField, Spinner } from "@shopify/polaris"
import { api } from "@/utils/api.client"

interface ProductInfo {
  id: string
  title: string
  handle?: string
  image?: string
  variants: Array<{
    id: string
    title: string
    price?: string
  }>
}

export interface ProductPickerProps {
  productId?: string
  variantId?: string
  onSelect: (productId: string, variantId?: string) => void
  label?: string
  helpText?: string
}

export const ProductPicker = ({
  productId,
  variantId,
  onSelect,
  label = "Select Product",
  helpText
}: ProductPickerProps) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProductId, setSelectedProductId] = useState<string>("")

  // 如果有 productId，获取商品详情
  const fetchProductDetails = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await api.get<{ products: ProductInfo[] }>(`/api/products?query=&limit=100`)
      const product = response.products.find(p => p.id === id)
      if (product) {
        setSelectedProduct(product)
      }
    } catch (error) {
      console.error("❌ 获取商品详情失败:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (productId && !selectedProduct) {
      fetchProductDetails(productId)
    }
  }, [productId, selectedProduct, fetchProductDetails])

  const handleSearch = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<{ products: ProductInfo[] }>(`/api/products?query=${encodeURIComponent(searchQuery)}&limit=20`)
      setProducts(response.products)
    } catch (error) {
      console.error("❌ 搜索商品失败:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const handleProductSelect = useCallback(() => {
    const product = products.find(p => p.id === selectedProductId)
    if (product) {
      setSelectedProduct(product)
      // 默认选择第一个变体
      const firstVariant = product.variants[0]
      onSelect(product.id, firstVariant?.id || undefined)
      setModalOpen(false)
      setSelectedProductId("")
      setSearchQuery("")
    }
  }, [products, selectedProductId, onSelect])

  const handleVariantChange = useCallback((value: string) => {
    if (selectedProduct && productId) {
      onSelect(productId, value || undefined)
    }
  }, [selectedProduct, productId, onSelect])

  const handleClear = useCallback(() => {
    setSelectedProduct(null)
    onSelect("", undefined)
  }, [onSelect])

  const handleModalOpen = useCallback(() => {
    setModalOpen(true)
    // 打开 modal 时自动加载商品列表（如果没有搜索过）
    if (products.length === 0 && !searchQuery) {
      handleSearch()
    }
  }, [products.length, searchQuery, handleSearch])

  return (
    <BlockStack gap="200">
      <div>
        <Text as="p" variant="bodyMd" fontWeight="semibold">
          {label}
        </Text>
        {helpText && (
          <Text as="p" variant="bodySm" tone="subdued">
            {helpText}
          </Text>
        )}
      </div>

      {selectedProduct || productId ? (
        <BlockStack gap="200">
          <InlineStack gap="200" align="start">
            {selectedProduct?.image && (
              <Thumbnail
                source={selectedProduct.image}
                alt={selectedProduct.title}
                size="small"
              />
            )}
            <BlockStack gap="100">
              <Text as="p" variant="bodyMd">
                {selectedProduct?.title || "Product selected"}
              </Text>
              {selectedProduct?.variants && selectedProduct.variants.length > 1 && (
                <Select
                  label="Variant"
                  options={selectedProduct.variants.map((variant) => ({
                    label: `${variant.title}${variant.price ? ` - $${variant.price}` : ""}`,
                    value: variant.id
                  }))}
                  value={variantId || selectedProduct.variants[0]?.id || ""}
                  onChange={handleVariantChange}
                />
              )}
            </BlockStack>
          </InlineStack>
          <InlineStack gap="200">
            <Button onClick={handleModalOpen}>
              Change Product
            </Button>
            <Button onClick={handleClear} tone="critical" variant="plain">
              Clear
            </Button>
          </InlineStack>
        </BlockStack>
      ) : (
        <Button onClick={handleModalOpen}>
          Select Product
        </Button>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedProductId("")
          setSearchQuery("")
        }}
        title="Select Product"
        primaryAction={{
          content: "Select",
          onAction: handleProductSelect,
          disabled: !selectedProductId
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setModalOpen(false)
              setSelectedProductId("")
              setSearchQuery("")
            }
          }
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <BlockStack gap="200">
              <TextField
                label="Search Products"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Enter product name..."
                autoComplete="off"
              />
              <Button onClick={handleSearch} loading={loading} fullWidth>
                Search
              </Button>
            </BlockStack>

            {loading && products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spinner size="small" />
              </div>
            ) : (
              <Select
                label="Products"
                options={[
                  { label: "Select a product...", value: "" },
                  ...products.map((product) => ({
                    label: product.title,
                    value: product.id
                  }))
                ]}
                value={selectedProductId}
                onChange={setSelectedProductId}
              />
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </BlockStack>
  )
}

