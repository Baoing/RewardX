import { useTranslation } from "react-i18next"

export function LoadingScreen() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-shopify-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-sm">
          {t("common.loading")}
        </p>
      </div>
    </div>
  )
}


