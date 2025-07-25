/**
 * Web Search Plugin
 * 提供统一的网络搜索能力，支持多个 AI Provider
 */
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'

import { createGoogleOptions, createXaiOptions, mergeProviderOptions } from '../../../options'
import { definePlugin } from '../../'
import type { AiRequestContext } from '../../types'
import { DEFAULT_WEB_SEARCH_CONFIG, WebSearchPluginConfig } from './helper'

/**
 * 网络搜索插件
 *
 * @param config - 在插件初始化时传入的静态配置
 */
export const webSearchPlugin = (config: WebSearchPluginConfig = DEFAULT_WEB_SEARCH_CONFIG) =>
  definePlugin({
    name: 'webSearch',
    enforce: 'pre',

    transformParams: async (params: any, context: AiRequestContext) => {
      const { providerId } = context

      // console.log('providerId', providerId)
      switch (providerId) {
        case 'openai': {
          if (config.openai) {
            if (!params.tools) params.tools = {}
            params.tools.web_search_preview = openai.tools.webSearchPreview(config.openai)
            // console.log('params.tools', params.tools)
          }

          break
        }

        case 'anthropic': {
          if (config.anthropic) {
            if (!params.tools) params.tools = {}
            params.tools.web_search = anthropic.tools.webSearch_20250305(config.anthropic)
          }

          break
        }

        case 'google': {
          // @ts-ignore - providerId is a string that can be used to index config
          if (config[providerId]) {
            const searchOptions = createGoogleOptions({ useSearchGrounding: true })
            params.providerOptions = mergeProviderOptions(params.providerOptions, searchOptions)
          }

          break
        }

        case 'xai': {
          if (config.xai) {
            const searchOptions = createXaiOptions({
              searchParameters: { ...config.xai, mode: 'on' }
            })
            params.providerOptions = mergeProviderOptions(params.providerOptions, searchOptions)
          }

          break
        }
        // default: {
        //   if (!params.providerOptions) params.providerOptions = {}
        //   params.providerOptions['aihubmix'] = {
        //     web_search: anthropic.tools.webSearch_20250305()
        //   }
        //   console.log('params.providerOptions', params.providerOptions)
        //   break
        // }
      }

      return params
    }
  })

// 导出类型定义供开发者使用
export type { WebSearchPluginConfig } from './helper'

// 默认导出
export default webSearchPlugin
