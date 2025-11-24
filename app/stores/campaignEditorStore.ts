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
   * 注册监听器 - 自动检测变化（作为备用机制）
   * updateField/updateFields 已有同步比较，这里作为安全网
   */
  private registerListener() {
    if (!this.editingCampaign) return

    // 直接监听 editingCampaign 对象的深层变化
    this.disposer = deepObserve(this.editingCampaign, () => {
      // 捕获所有类型的变化（update, add, remove）
      // 注意：updateField 已经同步调用了 compareAndUpdateStatus
      // 这里的调用会被 compareAndUpdateStatus 内部的检查过滤掉（如果状态没变）
      this.compareAndUpdateStatus()
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
   * 规范化空值：将 undefined、null、空字符串统一处理
   * 并删除这些空值字段，确保比较时 key 的存在性一致
   */
  private normalizeEmptyValues(obj: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {}

    for (const key in obj) {
      const value = obj[key]
      // 如果是空值（空字符串、null、undefined），则跳过（不添加到 normalized）
      // 这样可以确保：原本没有 key 和 key 为空值的情况被视为相同
      if (value !== "" && value !== null && value !== undefined) {
        normalized[key] = value
      }
      // 注意：空值字段不会被添加到 normalized，从而实现 key 存在性的统一
    }

    return normalized
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
    let baseFlat = flatten(this.originalCampaign, {
      safe: true // 保持数组不被扁平化
    }) as Record<string, any>
    let nowFlat = flatten(this.editingCampaign, {
      safe: true
    }) as Record<string, any>

    // 忽略只读字段
    const ignoredFields = ["id", "userId", "createdAt", "updatedAt", "totalPlays", "totalWins", "totalOrders"]
    ignoredFields.forEach(field => {
      delete baseFlat[field]
      delete nowFlat[field]
    })

    // 规范化空值（删除所有空值字段，确保 key 存在性一致）
    baseFlat = this.normalizeEmptyValues(baseFlat)
    nowFlat = this.normalizeEmptyValues(nowFlat)

    // 调试：打印 key 数量
    const baseKeys = Object.keys(baseFlat).length
    const nowKeys = Object.keys(nowFlat).length
    console.log(`🔍 Comparing: baseFlat has ${baseKeys} keys, nowFlat has ${nowKeys} keys`)

    // 精确比较
    const isChanged = !isEqual(baseFlat, nowFlat)

    if (this.hasUnsavedChanges !== isChanged) {
      this.hasUnsavedChanges = isChanged
      console.log(`📊 hasUnsavedChanges changed: ${isChanged}`)

      // 调试：打印差异字段
      if (isChanged) {
        const allKeys = new Set([...Object.keys(baseFlat), ...Object.keys(nowFlat)])
        const diffKeys = Array.from(allKeys).filter(key => !isEqual(baseFlat[key], nowFlat[key]))
        console.log(`🔍 Changed fields (${diffKeys.length}):`, diffKeys.slice(0, 5)) // 只显示前5个
        // 打印具体的差异值
        diffKeys.slice(0, 3).forEach(key => {
          const baseVal = key in baseFlat ? JSON.stringify(baseFlat[key]) : "(not exists)"
          const nowVal = key in nowFlat ? JSON.stringify(nowFlat[key]) : "(not exists)"
          console.log(`   ${key}: ${baseVal} → ${nowVal}`)
        })
      } else {
        console.log(`✅ All changes reverted, back to original state`)
      }
    }
  }

  /**
   * 更新编辑中的数据
   */
  updateField<K extends keyof Campaign>(field: K, value: Campaign[K]) {
    if (!this.editingCampaign) return

    console.log(`✏️ updateField: ${String(field)}`)
    this.editingCampaign[field] = value

    // 立即同步比较，不依赖 deepObserve 的延迟触发
    this.compareAndUpdateStatus()
  }

  /**
   * 批量更新字段
   */
  updateFields(updates: Partial<Campaign>) {
    if (!this.editingCampaign) return
    Object.assign(this.editingCampaign, updates)
    // 立即同步比较，不依赖 deepObserve 的延迟触发
    this.compareAndUpdateStatus()
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
    const ignoredFields = ["id", "userId", "createdAt", "updatedAt", "totalPlays", "totalWins", "totalOrders", "allowedOrderStatus", "requireOrder", "requireName", "requirePhone", "gameConfig"]

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

