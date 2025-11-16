import type { ActionFunctionArgs } from "react-router"
import { authenticate } from "../shopify.server"
import { updateUserSettings } from "../utils/user.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request)

  const formData = await request.formData()
  const appLanguage = formData.get("appLanguage") as string | null
  const language = formData.get("language") as string | null
  const timezone = formData.get("timezone") as string | null
  const theme = formData.get("theme") as string | null
  const notifications = formData.get("notifications") as string | null
  const settings = formData.get("settings") as string | null
  const metadata = formData.get("metadata") as string | null

  try {
    const updates: any = {}
    
    if (appLanguage) {
      updates.appLanguage = appLanguage
    }
    
    if (language) {
      updates.language = language
    }
    
    if (timezone) {
      updates.timezone = timezone
    }

    if (theme) {
      updates.theme = theme
    }

    if (notifications !== null) {
      updates.notifications = notifications === "true"
    }
    
    if (settings) {
      updates.settings = JSON.parse(settings)
    }

    if (metadata) {
      updates.metadata = JSON.parse(metadata)
    }

    const user = await updateUserSettings(session.shop, updates)

    return Response.json({ success: true, userInfo: user })
  } catch (error) {
    console.error("Failed to update user settings:", error)
    return Response.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

