import { Card, BlockStack, Text, Collapsible, InlineStack, Button, Icon } from "@shopify/polaris"
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface FAQItem {
  question: string
  answer: string
}

export function FAQCard() {
  const { t } = useTranslation()
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  // 从翻译文件获取 FAQ 列表
  const faqs: FAQItem[] = t("faq.items", { returnObjects: true }) as FAQItem[]

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          {t("faq.title")}
        </Text>

        <BlockStack gap="300">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
              <button
                onClick={() => toggleItem(index)}
                className="w-full text-left flex items-center justify-between gap-4 py-1"
                aria-expanded={openItems.has(index)}
              >
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  {faq.question}
                </Text>
                <div className="flex-shrink-0">
                  <Icon source={openItems.has(index) ? ChevronUpIcon : ChevronDownIcon} />
                </div>
              </button>

              <Collapsible
                open={openItems.has(index)}
                id={`faq-${index}`}
                transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
              >
                <div className="mt-2 text-gray-600">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {faq.answer}
                  </Text>
                </div>
              </Collapsible>
            </div>
          ))}
        </BlockStack>

        <div className="pt-2 border-t border-gray-200">
          <div className={"flex items-center gap-2"}>
            <Text as="p" variant="bodyMd" tone="subdued">
              {t("faq.moreHelp")}
            </Text>
            <Button
              url="https://docs.smartseo.com"
              target="_blank"
            >
              {t("faq.viewDocs")}
            </Button>
          </div>
        </div>
      </BlockStack>
    </Card>
  )
}

