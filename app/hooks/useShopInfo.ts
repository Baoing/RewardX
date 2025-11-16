import { useOutletContext } from "react-router"
import type { ShopInfo } from "../utils/shop.server"
import type { UserInfo } from "../utils/user.server"

interface AppContext {
  shopInfo: ShopInfo | null
  userInfo: UserInfo | null
}

/**
 * Hook to access shop information from the app context
 */
export function useShopInfo() {
  const context = useOutletContext<AppContext>()
  return context?.shopInfo || null
}

/**
 * Hook to access user information from the app context
 */
export function useUserInfo() {
  const context = useOutletContext<AppContext>()
  return context?.userInfo || null
}

/**
 * Hook to access both shop and user information from the app context
 */
export function useAppContext() {
  return useOutletContext<AppContext>()
}

