import { createContext, useContext } from "react"
import { userInfoStore } from "./userInfoStore"
import { commonStore } from "./commonStore"
import { campaignStore } from "./campaignStore"

export { userInfoStore } from "./userInfoStore"
export { commonStore } from "./commonStore"
export { campaignStore } from "./campaignStore"

export const StoreContext = createContext({
  userInfoStore,
  commonStore,
  campaignStore
})

export const useStores = () => {
  const stores = useContext(StoreContext)
  if (!stores) {
    throw new Error("useStores must be used within StoreProvider")
  }
  return stores
}

export const useUserInfoStore = () => {
  const { userInfoStore } = useStores()
  return userInfoStore
}

export const useCommonStore = () => {
  const { commonStore } = useStores()
  return commonStore
}

export const useCampaignStore = () => {
  const { campaignStore } = useStores()
  return campaignStore
}

