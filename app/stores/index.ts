import { createContext, useContext } from "react"
import { userInfoStore } from "./userInfoStore"
import { commonStore } from "./commonStore"
import { campaignStore } from "./campaignStore"
import { campaignEditorStore } from "./campaignEditorStore"
import { billingStore } from "./billingStore"

export { userInfoStore } from "./userInfoStore"
export { commonStore } from "./commonStore"
export { campaignStore } from "./campaignStore"
export { campaignEditorStore } from "./campaignEditorStore"
export { billingStore } from "./billingStore"

export const StoreContext = createContext({
  userInfoStore,
  commonStore,
  campaignStore,
  campaignEditorStore
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

export const useCampaignEditorStore = () => {
  const { campaignEditorStore } = useStores()
  return campaignEditorStore
}

