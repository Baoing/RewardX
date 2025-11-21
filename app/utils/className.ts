/**
 * CSS 类名生成工具
 * 用于统一管理组件类名，方便后续 CSS 定制和问题排查
 */

const DEFAULT_PREFIX = "rewardx"

/**
 * 生成标准类名
 * @param className - 类名
 * @param prefix - 前缀，默认为 "rewardx"
 * @returns 格式化的类名，如 "rewardx__ComponentName"
 */
export function getClassName(className: string, prefix: string = DEFAULT_PREFIX): string {
  return `${prefix}__${className}`
}

/**
 * 生成组件特定类名
 * @param componentName - 组件名称，如 "ColorPicker", "CampaignItem"
 * @param className - 类名
 * @param prefix - 前缀，默认为 "rewardx"
 * @returns 格式化的类名，如 "rewardx-ColorPicker__className"
 */
export function getComponentClassName(
  componentName: string,
  className: string,
  prefix: string = DEFAULT_PREFIX
): string {
  return `${prefix}-${componentName}__${className}`
}

/**
 * 生成多个类名（用于组合）
 * @param classNames - 类名数组
 * @param prefix - 前缀，默认为 "rewardx"
 * @returns 格式化的类名数组
 */
export function getClassNames(
  classNames: string[],
  prefix: string = DEFAULT_PREFIX
): string[] {
  return classNames.map(name => getClassName(name, prefix))
}

/**
 * 生成组件特定的多个类名
 * @param componentName - 组件名称
 * @param classNames - 类名数组
 * @param prefix - 前缀，默认为 "rewardx"
 * @returns 格式化的类名数组
 */
export function getComponentClassNames(
  componentName: string,
  classNames: string[],
  prefix: string = DEFAULT_PREFIX
): string[] {
  return classNames.map(name => getComponentClassName(componentName, name, prefix))
}

/**
 * 组合类名（支持条件类名）
 * @param classNames - 类名数组或对象
 * @param prefix - 前缀，默认为 "rewardx"
 * @returns 组合后的类名字符串
 */
export function combineClassNames(
  classNames: (string | undefined | null | false)[] | Record<string, boolean>,
  prefix: string = DEFAULT_PREFIX
): string {
  if (Array.isArray(classNames)) {
    return classNames
      .filter(Boolean)
      .map(name => getClassName(name as string, prefix))
      .join(" ")
  }

  // 对象形式：{ "active": true, "disabled": false }
  return Object.entries(classNames)
    .filter(([, condition]) => condition)
    .map(([name]) => getClassName(name, prefix))
    .join(" ")
}

/**
 * 组合组件特定类名
 * @param componentName - 组件名称
 * @param classNames - 类名数组或对象
 * @param prefix - 前缀，默认为 "rewardx"
 * @returns 组合后的类名字符串
 */
export function combineComponentClassNames(
  componentName: string,
  classNames: (string | undefined | null | false)[] | Record<string, boolean>,
  prefix: string = DEFAULT_PREFIX
): string {
  if (Array.isArray(classNames)) {
    return classNames
      .filter(Boolean)
      .map(name => getComponentClassName(componentName, name as string, prefix))
      .join(" ")
  }

  return Object.entries(classNames)
    .filter(([, condition]) => condition)
    .map(([name]) => getComponentClassName(componentName, name, prefix))
    .join(" ")
}

