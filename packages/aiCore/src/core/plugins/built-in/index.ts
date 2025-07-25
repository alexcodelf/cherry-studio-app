/**
 * 内置插件命名空间
 * 所有内置插件都以 'built-in:' 为前缀
 */
export const BUILT_IN_PLUGIN_PREFIX = 'built-in:'

export { createLoggingPlugin } from './logging'
export { createPromptToolUsePlugin } from './toolUsePlugin/promptToolUsePlugin'
export type { PromptToolUseConfig, ToolUseRequestContext, ToolUseResult } from './toolUsePlugin/type'
export { type WebSearchConfig, webSearchPlugin } from './webSearchPlugin'
