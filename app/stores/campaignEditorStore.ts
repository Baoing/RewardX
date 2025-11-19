import { makeAutoObservable } from "mobx"
import { deepObserve, IDisposer } from "mobx-utils"
import { flatten } from "flat"
import { cloneDeep, isEqual } from "lodash-es"
import type { Campaign } from "@/types/campaign"

/**
 * Campaign 编辑器状态管理
 * 负责追踪编辑状态、diff比较、保存/撤销逻辑
 * 
 * 核心特性：
 * 1. 使用 mobx-utils deepObserve 自动监听状态变化
 * 2. 使用 flat 扁平化对象，提供精确的深度比较
 * 3. 使用 lodash-es isEqual 进行高性能比较
 */
class CampaignEditorStore {
  // 原始数据（从服务器加载的）
  originalCampaign: Campaign | null = null
  
  // 当前编辑中的数据
  editingCampaign: Campaign | null = null
  
  // 是否有未保存的更改（自动计算）
  hasUnsavedChanges = false
  
  // 是否正在保存
  isSaving = false
  
  // 监听器句柄
  private disposer: IDisposer | null = null
  
  constructor() {
    makeAutoObservable(this)
  }

  /**
   * 初始化编辑器（加载campaign数据）
   */
  initEditor(campaign: Campaign) {
    console.log("🔧 Initializing campaign editor")
    
    // 先销毁旧的监听器
    this.destroyListener()
    
    // 深拷贝数据
    this.originalCampaign = cloneDeep(campaign)
    this.editingCampaign = cloneDeep(campaign)
    this.hasUnsavedChanges = false
    
    // 注册新的监听器
    this.registerListener()
  }

  /**
   * 重置编辑器
   */
  resetEditor() {
    console.log("🧹 Resetting campaign editor")
    this.destroyListener()
    this.originalCampaign = null
    this.editingCampaign = null
    this.hasUnsavedChanges = false
    this.isSaving = false
  }

  /**
   * 注册监听器 - 自动检测变化
   */
  private registerListener() {
    if (!this.editingCampaign) return

    this.disposer = deepObserve(this, (change) => {
      // 只监听 editingCampaign 的更新
      if (change.type === "update" && change.observableKind === "object") {
        this.compareAndUpdateStatus()
      }
    })

    console.log("✅ Campaign editor listener registered")
  }

  /**
   * 销毁监听器
   */
  private destroyListener() {
    if (this.disposer) {
      this.disposer()
      this.disposer = null
      console.log("❌ Campaign editor listener destroyed")
    }
  }

  /**
   * 比较并更新状态
   */
  private compareAndUpdateStatus() {
    if (!this.originalCampaign || !this.editingCampaign) {
      this.hasUnsavedChanges = false
      return
    }

    // 扁平化对象，忽略某些字段（如 updatedAt, createdAt 等只读字段）
    const baseFlat = flatten(this.originalCampaign, {
      safe: true // 保持数组不被扁平化
    }) as Record<string, any>
    const nowFlat = flatten(this.editingCampaign, {
      safe: true
    }) as Record<string, any>

    // 忽略只读字段
    const ignoredFields = ["id", "userId", "createdAt", "updatedAt", "totalPlays", "totalWins", "totalOrders"]
    ignoredFields.forEach(field => {
      delete baseFlat[field]
      delete nowFlat[field]
    })

    // 精确比较
    const isChanged = !isEqual(baseFlat, nowFlat)

    if (this.hasUnsavedChanges !== isChanged) {
      this.hasUnsavedChanges = isChanged
      console.log(`📊 hasUnsavedChanges: ${isChanged}`)
    }
  }

  /**
   * 更新编辑中的数据
   */
  updateField<K extends keyof Campaign>(field: K, value: Campaign[K]) {
    if (!this.editingCampaign) return
    this.editingCampaign[field] = value
    // deepObserve 会自动触发 compareAndUpdateStatus
  }

  /**
   * 批量更新字段
   */
  updateFields(updates: Partial<Campaign>) {
    if (!this.editingCampaign) return
    Object.assign(this.editingCampaign, updates)
    // deepObserve 会自动触发 compareAndUpdateStatus
  }

  /**
   * 撤销所有更改（恢复到原始数据）
   */
  discardChanges() {
    if (!this.originalCampaign) return
    
    console.log("↩️ Discarding all changes")
    
    // 临时销毁监听器，避免触发不必要的比较
    this.destroyListener()
    
    // 深拷贝恢复原始数据
    this.editingCampaign = cloneDeep(this.originalCampaign)
    this.hasUnsavedChanges = false
    
    // 重新注册监听器
    this.registerListener()
  }

  /**
   * 获取更改的字段（用于提交给API）
   */
  get changedFields(): Partial<Campaign> {
    if (!this.originalCampaign || !this.editingCampaign) return {}
    
    const changes: any = {}
    const keys = Object.keys(this.editingCampaign) as Array<keyof Campaign>
    
    // 忽略只读字段
    const ignoredFields = ["id", "userId", "createdAt", "updatedAt", "totalPlays", "totalWins", "totalOrders", "allowedOrderStatus", "requireEmail", "requireName", "requirePhone", "gameConfig"]
    
    for (const key of keys) {
      if (ignoredFields.includes(key as string)) continue
      
      if (!isEqual(this.originalCampaign[key], this.editingCampaign[key])) {
        changes[key] = this.editingCampaign[key]
      }
    }
    
    console.log("📝 Changed fields:", Object.keys(changes))
    return changes as Partial<Campaign>
  }

  /**
   * 标记保存成功（更新原始数据）
   */
  markSaved() {
    if (!this.editingCampaign) return
    
    console.log("✅ Marking as saved, updating original data")
    
    // 临时销毁监听器
    this.destroyListener()
    
    // 深拷贝当前编辑数据作为新的原始数据
    this.originalCampaign = cloneDeep(this.editingCampaign)
    this.hasUnsavedChanges = false
    
    // 重新注册监听器
    this.registerListener()
  }

  /**
   * 设置保存状态
   */
  setIsSaving(isSaving: boolean) {
    this.isSaving = isSaving
  }
}

export const campaignEditorStore = new CampaignEditorStore()

