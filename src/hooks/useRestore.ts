import { useToastController } from '@tamagui/toast'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { RestoreStep } from '@/components/settings/data/RestoreProgressModal'
import { ProgressUpdate, restore, RestoreStepId } from '@/services/BackupService'
import { FileType } from '@/types/file'
import { uuid } from '@/utils'
import { getFileType } from '@/utils/file'

// 定义步骤配置类型
export interface StepConfig {
  id: RestoreStepId
  titleKey: string
}

// 预定义的步骤配置
export const RESTORE_STEP_CONFIGS = {
  // 公共步骤
  RESTORE_TOPICS: { id: 'restore_topics' as RestoreStepId, titleKey: 'settings.data.restore.steps.restore_topics' },
  RESTORE_MESSAGES_BLOCKS: {
    id: 'restore_messages_blocks' as RestoreStepId,
    titleKey: 'settings.data.restore.steps.restore_messages_blocks'
  },
  RESTORE_LLM_PROVIDERS: {
    id: 'restore_llm_providers' as RestoreStepId,
    titleKey: 'settings.data.restore.steps.restore_llm_providers'
  },
  RESTORE_ASSISTANTS: {
    id: 'restore_assistants' as RestoreStepId,
    titleKey: 'settings.data.restore.steps.restore_assistants'
  },
  RESTORE_WEBSEARCH: {
    id: 'restore_websearch' as RestoreStepId,
    titleKey: 'settings.data.restore.steps.restore_websearch'
  },

  // 局域网恢复特有步骤
  NETWORK_DISCOVERY: {
    id: 'network_discovery' as RestoreStepId,
    titleKey: 'settings.data.restore.steps.network_discovery'
  },
  NETWORK_CONNECT: { id: 'network_connect' as RestoreStepId, titleKey: 'settings.data.restore.steps.network_connect' },
  NETWORK_DOWNLOAD: {
    id: 'network_download' as RestoreStepId,
    titleKey: 'settings.data.restore.steps.network_download'
  },

  // 本地恢复特有步骤
  FILE_VALIDATION: { id: 'file_validation' as RestoreStepId, titleKey: 'settings.data.restore.steps.file_validation' },
  FILE_EXTRACTION: { id: 'file_extraction' as RestoreStepId, titleKey: 'settings.data.restore.steps.file_extraction' }
} as const

// 预定义的步骤组合
export const DEFAULT_RESTORE_STEPS: StepConfig[] = [
  RESTORE_STEP_CONFIGS.RESTORE_TOPICS,
  RESTORE_STEP_CONFIGS.RESTORE_MESSAGES_BLOCKS,
  RESTORE_STEP_CONFIGS.RESTORE_LLM_PROVIDERS,
  RESTORE_STEP_CONFIGS.RESTORE_ASSISTANTS,
  RESTORE_STEP_CONFIGS.RESTORE_WEBSEARCH
]

export const LOCAL_RESTORE_STEPS: StepConfig[] = [
  RESTORE_STEP_CONFIGS.FILE_VALIDATION,
  RESTORE_STEP_CONFIGS.FILE_EXTRACTION,
  ...DEFAULT_RESTORE_STEPS
]

export const NETWORK_RESTORE_STEPS: StepConfig[] = [
  RESTORE_STEP_CONFIGS.NETWORK_DISCOVERY,
  RESTORE_STEP_CONFIGS.NETWORK_CONNECT,
  RESTORE_STEP_CONFIGS.NETWORK_DOWNLOAD,
  ...DEFAULT_RESTORE_STEPS
]

const createStepsFromConfig = (stepConfigs: StepConfig[], t: (key: string) => string): RestoreStep[] => {
  return stepConfigs.map(config => ({
    id: config.id,
    title: t(config.titleKey),
    status: 'pending' as const
  }))
}

export interface UseRestoreOptions {
  stepConfigs?: StepConfig[]
  customRestoreFunction?: (file: Omit<FileType, 'md5'>, onProgress: (update: ProgressUpdate) => void) => Promise<void>
}

export function useRestore(options: UseRestoreOptions = {}) {
  const { t } = useTranslation()
  const toast = useToastController()

  const { stepConfigs = DEFAULT_RESTORE_STEPS, customRestoreFunction = restore } = options

  const [isModalOpen, setModalOpen] = useState(false)
  const [restoreSteps, setRestoreSteps] = useState<RestoreStep[]>(createStepsFromConfig(stepConfigs, t))
  const [overallStatus, setOverallStatus] = useState<'running' | 'success' | 'error'>('running')

  const validateFile = (file: { mimeType?: string; name: string; type?: string }) => {
    const isZip = file.mimeType === 'application/zip' || file.name.endsWith('.zip') || file.type === 'application/zip'

    if (!isZip) {
      toast.show(t('settings.data.restore.error'), {
        message: t('settings.data.restore.error_message'),
        native: true
      })
      return false
    }

    return true
  }

  const createFileObject = (file: {
    name: string
    uri: string
    size?: number
    mimeType?: string
    type?: string
  }): Omit<FileType, 'md5'> => ({
    id: uuid(),
    name: file.name,
    origin_name: file.name,
    path: file.uri,
    size: file.size || 0,
    ext: file.name.split('.').pop() || '',
    type: getFileType(file.name.split('.').pop() || ''),
    mime_type: file.mimeType || file.type || '',
    created_at: new Date().toISOString(),
    count: 1
  })

  const handleProgressUpdate = (update: ProgressUpdate) => {
    setRestoreSteps(prevSteps =>
      prevSteps.map(step => (step.id === update.step ? { ...step, status: update.status, error: update.error } : step))
    )
  }

  const handleError = () => {
    setOverallStatus('error')
    setRestoreSteps(prevSteps => {
      const errorStepIndex = prevSteps.findIndex(step => step.status === 'in_progress')

      if (errorStepIndex > -1) {
        const newSteps = [...prevSteps]
        newSteps[errorStepIndex] = { ...newSteps[errorStepIndex], status: 'error' }
        return newSteps
      }

      return prevSteps
    })
  }

  const startRestore = async (file: { name: string; uri: string; size?: number; mimeType?: string }) => {
    if (!validateFile(file)) return

    // 重置状态并打开模态框
    setRestoreSteps(createStepsFromConfig(stepConfigs, t))
    setOverallStatus('running')
    setModalOpen(true)

    try {
      const fileObject = createFileObject(file)
      await customRestoreFunction(fileObject, handleProgressUpdate)
      setOverallStatus('success')
    } catch (err) {
      console.log('Error during restore process:', err)
      handleError()
    }
  }

  return {
    isModalOpen,
    restoreSteps,
    overallStatus,
    startRestore,
    closeModal: () => setModalOpen(false)
  }
}
