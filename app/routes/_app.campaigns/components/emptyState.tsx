import {useTranslation} from "react-i18next";
import {Card} from "@/components/EnhancePolaris"
import {EmptyState as EmptyComponent} from "@shopify/polaris"

export default function EmptyState () {
  const { t } = useTranslation()

  return <Card>
    <EmptyComponent
      heading="No campaigns found"
      action={{
        content: "Create your first campaign",
        onAction: () => {
          window.location.href = "/campaigns/create"
        }
      }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Create a lottery campaign to engage your customers</p>
    </EmptyComponent>
  </Card>
}
