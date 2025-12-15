import { useState, useCallback, useEffect } from "react"
import { Button, Text, BlockStack, InlineStack, Thumbnail, Modal, TextField, Spinner, InlineError, Checkbox } from "@shopify/polaris"
import { api } from "@/utils/api.client"
import styles from "./ProductPicker.module.scss"

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
  // 多选相关：最多可选多少个商品，默认为 1（兼容当前用法）
  maxSelectable?: number
}

export const ProductPicker = ({
  productId,
  variantId,
  onSelect,
  label = "Select Product",
  helpText,
  maxSelectable = 1
}: ProductPickerProps) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  // 以变体为粒度记录选择
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [hasSearched, setHasSearched] = useState(false)

  // 搜索防抖，提升体验：输入后自动触发搜索，而不是点按钮
  useEffect(() => {
    if (!modalOpen) {
      return
    }

    const trimmed = searchQuery.trim()

    const timer = window.setTimeout(() => {
      void handleSearch(trimmed)
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [searchQuery, modalOpen])

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

  // 根据外部传入的变体初始化内部选中列表，保证兼容旧用法
  useEffect(() => {
    if (variantId) {
      setSelectedVariantIds([variantId])
    } else {
      setSelectedVariantIds([])
    }
  }, [variantId])

  const handleSearch = useCallback(async (query: string) => {
    try {
      setLoading(true)
      setErrorMessage(undefined)
      const response = await api.get<{ products: ProductInfo[] }>(
        `/api/products?query=${encodeURIComponent(query)}&limit=20`
      )
      setProducts(response.products)
      setHasSearched(true)
    } catch (error) {
      console.error("❌ 搜索商品失败:", error)
      setErrorMessage("Failed to load products")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleProductSelect = useCallback(() => {
    if (selectedVariantIds.length === 0) {
      return
    }

    // 兼容现有签名：仍然只返回第一个选中的变体
    const firstVariantId = selectedVariantIds[0]
    const product = products.find(p =>
      p.variants.some(variant => variant.id === firstVariantId)
    )
    const variant = product?.variants.find(v => v.id === firstVariantId)
    if (product && variant) {
      setSelectedProduct(product)
      onSelect(product.id, variant.id)
      setModalOpen(false)
      setSearchQuery("")
      // 多选模式下仍然保留内部选中状态，交由外部根据需要重置
    }
  }, [products, selectedVariantIds, onSelect])

  const handleVariantChange = useCallback((value: string) => {
    if (selectedProduct && productId) {
      onSelect(productId, value || undefined)
    }
  }, [selectedProduct, productId, onSelect])

  const handleClear = useCallback(() => {
    setSelectedProduct(null)
    setSelectedVariantIds([])
    onSelect("", undefined)
  }, [onSelect])

  const handleModalOpen = useCallback(() => {
    setModalOpen(true)
    setHasSearched(false)
    setErrorMessage(undefined)
    setSearchQuery("")
    setProducts([])
    setSelectedVariantIds(variantId ? [variantId] : [])

    if (products.length === 0 && !searchQuery) {
      void handleSearch("")
    }
  }, [products.length, searchQuery, handleSearch, variantId])

  // 将已选中的变体排在前面，方便用户查看和取消选择
  const variantItems = products.flatMap((product) =>
    product.variants.map((variant) => ({
      product,
      variant
    }))
  )

  const sortedVariantItems = [...variantItems].sort((a, b) => {
    const aSelected = selectedVariantIds.includes(a.variant.id)
    const bSelected = selectedVariantIds.includes(b.variant.id)
    if (aSelected === bSelected) {
      return 0
    }
    return aSelected ? -1 : 1
  })

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
              {selectedProduct && selectedProduct.variants.length > 0 && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {selectedProduct.variants.find(
                    variant => selectedVariantIds.includes(variant.id)
                  )?.title || selectedProduct.variants[0]?.title}
                </Text>
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
          setSearchQuery("")
          setErrorMessage(undefined)
          setHasSearched(false)
          setSelectedVariantIds(variantId ? [variantId] : [])
        }}
        title="Select Product"
        primaryAction={{
          content: "Select",
          onAction: handleProductSelect,
          disabled: selectedVariantIds.length === 0
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setModalOpen(false)
              setSearchQuery("")
            }
          }
        ]}
      >

          <BlockStack gap="300">
            <div className={styles.modalHeader}>
            <BlockStack gap="200">
              <TextField
                label="Search Products"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Enter product name or keyword..."
                autoComplete="off"
              />
              {errorMessage && (
                <InlineError message={errorMessage} fieldID="product-search" />
              )}
            </BlockStack>
            </div>

            {loading && products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px" }}>
                <Spinner size="small" />
              </div>
            ) : (
              <>
                {products.length === 0 && hasSearched ? (
                  <Text as="p" tone="subdued">
                    No products match this search.
                  </Text>
                ) : (
                  <BlockStack gap="100">
                    {sortedVariantItems.map(({ product, variant }) => {
                      const isActive = selectedVariantIds.includes(variant.id)
                      const hasReachedLimit = selectedVariantIds.length >= maxSelectable
                      const isDisabled = !isActive && hasReachedLimit

                      return (
                        <button
                          className={styles.productButton}
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            if (isDisabled) {
                              return
                            }
                            setSelectedVariantIds((prev) => {
                              if (prev.includes(variant.id)) {
                                return prev.filter(id => id !== variant.id)
                              }
                              if (prev.length >= maxSelectable) {
                                return prev
                              }
                              return [...prev, variant.id]
                            })
                          }}
                          disabled={isDisabled}
                        >
                          <div
                            className={"flex gap-2 items-center"}
                          >
                            <div onClick={(event) => {
                              event.stopPropagation()
                            }}>


                            <Checkbox
                              label=""
                              checked={isActive}
                              disabled={isDisabled}
                              onChange={() => {
                                if (isDisabled) {
                                  return
                                }
                                setSelectedVariantIds((prev) => {
                                  if (prev.includes(variant.id)) {
                                    return prev.filter(id => id !== variant.id)
                                  }
                                  if (prev.length >= maxSelectable) {
                                    return prev
                                  }
                                  return [...prev, variant.id]
                                })
                              }}
                            />
                            </div>
                            <div className={"flex items-center gap-2"}>
                              {product.image && (
                                <Thumbnail
                                  source={product.image}
                                  alt={product.title}
                                  size="small"
                                />
                              )}

                              <div className={"text-left flex-1"}>
                                <Text as="p" variant="bodyMd">
                                  {product.title} - <Text as="span" variant="bodySm" tone="subdued">
                                  {variant.title}
                                </Text>
                                </Text>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </BlockStack>
                )}
              </>
            )}
          </BlockStack>
      </Modal>
    </BlockStack>
  )
}

