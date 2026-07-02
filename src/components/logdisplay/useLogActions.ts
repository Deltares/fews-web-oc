import { ref } from 'vue'
import {
  ForecasterNoteKeysRequest,
  ForecasterNoteRequest,
  LogDisplayLogsActionRequest,
  PiWebserviceProvider,
  type LogDisplayDisseminationAction,
} from '@deltares/fews-pi-requests'
import {
  getLogDisseminationKey,
  type LogDisseminationStatus,
  type LogMessage,
} from '@/lib/log'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

interface UseLogActionsOptions {
  baseUrl: string
  getLogDisplayId: () => string
  getNoteGroupId: () => string
  onRefresh: () => void | Promise<void>
}

export function useLogActions(options: UseLogActionsOptions) {
  const disseminationStatus = ref<Record<string, LogDisseminationStatus>>({})

  const createProvider = () =>
    new PiWebserviceProvider(options.baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })

  async function disseminateLog(
    log: LogMessage,
    dissemination: LogDisplayDisseminationAction,
  ) {
    const provider = createProvider()
    const request: LogDisplayLogsActionRequest = {
      logDisplayId: options.getLogDisplayId(),
      actionId: dissemination.id,
      logMessage: log.text,
      logLevel: log.level,
    }
    const key = getLogDisseminationKey(log, dissemination)

    disseminationStatus.value[key] = {
      isLoading: true,
    }

    try {
      await provider.postLogDisplaysAction(request)
    } catch (error) {
      disseminationStatus.value[key] = {
        isLoading: false,
        error: (error as Error).message,
      }
      return
    }

    disseminationStatus.value[key] = {
      isLoading: false,
      success: true,
    }
  }

  async function deleteLog(log: LogMessage) {
    const provider = createProvider()
    const keys: ForecasterNoteKeysRequest = {
      logs: [{ id: log.id, taskRunId: log.taskRunId }],
    }
    await provider.deleteForecasterNote(keys)
    await options.onRefresh()
  }

  async function editLog(log: LogMessage) {
    const provider = createProvider()
    const note: ForecasterNoteRequest = {
      noteGroupId: options.getNoteGroupId(),
      logMessage: log.text,
      logLevel: log.level,
      id: log.id,
      taskRunId: log.taskRunId,
      userId: log.user,
    }
    await provider.postForecasterNote(note)
    await options.onRefresh()
  }

  async function acknowledgeLog(log: LogMessage) {
    const provider = createProvider()
    const keys: ForecasterNoteKeysRequest = {
      logs: [{ id: log.id, taskRunId: log.taskRunId }],
    }
    await provider.acknowledgeForecasterNote(keys)
    await options.onRefresh()
  }

  async function unacknowledgeLog(log: LogMessage) {
    const provider = createProvider()
    const keys: ForecasterNoteKeysRequest = {
      logs: [{ id: log.id, taskRunId: log.taskRunId }],
    }
    await provider.unacknowledgeForecasterNote(keys)
    await options.onRefresh()
  }

  return {
    disseminationStatus,
    disseminateLog,
    deleteLog,
    editLog,
    acknowledgeLog,
    unacknowledgeLog,
  }
}
