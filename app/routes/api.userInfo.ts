import type { LoaderFunctionArgs } from "react-router"
import { authenticate } from "@/shopify.server"
import { getUser } from "@/utils/user.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request)

  const user = await getUser(session.shop)

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }

  return Response.json({ userInfo: user })
}

