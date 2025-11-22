import { useTranslation } from "react-i18next"
import { Card } from "@/components/EnhancePolaris"
import { EmptyState as EmptyComponent } from "@shopify/polaris"

export interface EmptyStateProps {
  onCreateCampaign: () => void | Promise<void>
  isCreating?: boolean
}

const EmptyState = ({ onCreateCampaign, isCreating }: EmptyStateProps) => {
  const { t } = useTranslation()

  return <Card>
    <EmptyComponent
      heading="No campaigns found"
      action={{
        content: "Create your first campaign",
        onAction: onCreateCampaign,
        loading: isCreating
      }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Create a lottery campaign to engage your customers</p>
    </EmptyComponent>
  </Card>
}

export default EmptyState
