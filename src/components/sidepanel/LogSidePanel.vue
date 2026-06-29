<template>
  <SidePanelContent :title="t('sidePanel.logDisplay')" @close="emit('close')">
    <div class="d-flex align-center pa-2 ga-2">
      <v-spacer />
      <PeriodFilterControl v-model="period" />
    </div>
    <div class="w-100">
      <v-text-field
        v-model="search"
        placeholder="Search"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        rounded
        clearable
        hide-details
        class="px-2 pb-1"
        density="compact"
      />
    </div>
    <div class="d-flex py-2 mx-auto">
      <LogLevelFilter v-model="selectedLevels" />
    </div>
    <v-virtual-scroll
      class="d-flex flex-1-1 flex-column h-100 px-1 pb-1"
      :items="groupedByTaskRunId"
      :item-height="50"
    >
      <template #default="{ item }">
        <DateSeparator v-if="item.type === 'dateSeparator'" :date="item.date" />
          <LogItem
            v-else-if="item.type === 'logItem'"
            :logs="item.logs"
            :taskRuns="taskRuns"
            :disseminations="disseminations"
            :disseminationStatus="disseminationStatus"
            :userName="preferredUsername"
            :noteGroup="noteGroup"
            v-model:expanded="expandedItems[item.logs[0].taskRunId]"
            @disseminate-log="disseminateLog"
            @delete-log="deleteLog"
            @edit-log="editLog"
            @acknowledge-log="acknowledgeLog"
            @unacknowledge-log="unacknowledgeLog"
          />
      </template>
    </v-virtual-scroll>
    <div class="pa-2">
      <NewLogMessage
        v-if="noteGroup"
        :noteGroup="noteGroup"
        @newNote="refreshLogs"
      />
    </div>
    <v-divider />
    <v-footer class="d-flex flex-0">
      <div class="refresh-container ms-3">
        Last updated: {{ lastUpdatedString }}
      </div>
      <v-spacer />
      <v-btn
        density="compact"
        variant="plain"
        icon="mdi-refresh"
        :loading="isLoading"
        @click="refreshLogs()"
      >
        <template #loader>
          <v-progress-circular size="20" indeterminate />
        </template>
      </v-btn>
    </v-footer>
  </SidePanelContent>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  ForecasterNoteKeysRequest,
  ForecasterNoteRequest,
  LogDisplayLogsActionRequest,
  PiWebserviceProvider,
  type LogDisplayDisseminationAction,
  type TopologyNode,
} from '@deltares/fews-pi-requests'

import {
  logLevels,
  type LogDisseminationStatus,
  type LogLevel,
  type LogMessage,
  type LogType,
} from '@/lib/log/types'

import SidePanelContent from './SidePanelContent.vue'
import LogItem from '@/components/logdisplay/LogItem.vue'
import LogLevelFilter from '@/components/logdisplay/LogLevelFilter.vue'
import DateSeparator from '@/components/logdisplay/DateSeparator.vue'
import PeriodFilterControl from '@/components/tasks/PeriodFilterControl.vue'
import NewLogMessage from '@/components/logdisplay/NewLogMessage.vue'

import { refDebounced } from '@vueuse/core'
import { configManager } from '@/services/application-config'
import { useLogDisplayLogs } from '@/services/useLogDisplayLogs'
import { filterLog, getLogDisseminationKey, getManualFilters, getSystemFilters } from '@/lib/log/utils'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import { useLogDisplay } from '@/services/useLogDisplay'
import { useCurrentUser } from '@/services/useCurrentUser'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { useTaskRuns } from '@/services/useTaskRuns'
import { RelativePeriod } from '@/lib/period/types.ts'
import { useNoteGroup } from '@/services/useNoteGroup/index.ts'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.ts'

interface Props {
  topologyNode?: TopologyNode
  settings: {
    logDisplayId: string
  }
}

const props = defineProps<Props>()

const { t } = useI18n()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const { logDisplay } = useLogDisplay(baseUrl, () => props.settings.logDisplayId)
const { noteGroup } = useNoteGroup(
  baseUrl,
  () => logDisplay.value?.manualLog?.noteGroupId,
)

const { preferredUsername } = useCurrentUser()
useAvailableWorkflowsStore()

const period = ref<RelativePeriod | null>({
  startOffsetSeconds: -24 * 60 * 60,
  endOffsetSeconds: 0,
})

const search = ref<string>()
const maxCount = ref<number>(20000)
const selectedLevels = ref<LogLevel[]>([...logLevels])
const selectedLogTypes = ref<LogType | null>(null)
const expandedItems = ref<Record<string, boolean>>({})

const requestDebounce = 500

const filterDebounce = 100
const debouncedSelectedLevels = refDebounced(selectedLevels, filterDebounce)
const debouncedSelectedLogTypes = refDebounced(selectedLogTypes, filterDebounce)
const debouncedSearch = refDebounced(search, filterDebounce)
const now = ref<Date>(new Date())

const baseFilters = computed(() => {
  const start = new Date(
    now.value.getTime() +
      (period.value?.startOffsetSeconds ?? -24 * 60 * 60) * 1000,
  )
  const end = new Date(
    now.value.getTime() + (period.value?.endOffsetSeconds ?? 0) * 1000,
  )
  console.log('Base filters', start, end)
  const startTime = convertJSDateToFewsPiParameter(start)
  const endTime = convertJSDateToFewsPiParameter(end)
  return {
    logDisplayId: logDisplay.value?.id ?? '',
    maxCount: maxCount.value,
    startTime,
    endTime,
  }
})

const manualFilters = computed(() => {
  const manualEventCodeId = noteGroup.value?.note.eventCodeId
  return manualEventCodeId
    ? getManualFilters(baseFilters.value, manualEventCodeId)
    : []
})

const systemFilters = computed(() => {
  const systemLogSettings = logDisplay.value?.systemLog
  return systemLogSettings
    ? getSystemFilters(baseFilters.value, systemLogSettings)
    : []
})

// To keep requests in sync between manual and system logs
const filters = computed(() => {
  console.log('Filters', manualFilters.value, systemFilters.value)
  const hasManual = logDisplay.value?.manualLog
  const hasSystem = logDisplay.value?.systemLog
  if (
    (hasManual && !manualFilters.value.length) ||
    (hasSystem && !systemFilters.value.length)
  ) {
    return {
      manual: [],
      system: [],
    }
  }

  return {
    manual: manualFilters.value,
    system: systemFilters.value,
  }
})

const debouncedFilters = refDebounced(filters, requestDebounce)

const customFilter = (message: LogMessage) =>
  filterLog(
    message,
    debouncedSelectedLevels.value,
    debouncedSelectedLogTypes.value ? [debouncedSelectedLogTypes.value] : [],
    debouncedSearch.value,
    [],
    [],
  )

const { logMessages, isLoading, lastUpdatedTimestamp, groupedByTaskRunId } =
  useLogDisplayLogs(baseUrl, () => debouncedFilters.value, customFilter)

const taskRunIds = computed(() => {
  const _taskRunIds = logMessages.value.map((logs) => logs.taskRunId)
  const uniqueTaskRunIds = Array.from(new Set(_taskRunIds))
  return uniqueTaskRunIds
})

const { taskRuns } = useTaskRuns(baseUrl, () => ({
  taskRunIds: taskRunIds.value,
}))

const disseminations = computed<LogDisplayDisseminationAction[]>(
  () => logDisplay.value?.logDissemination?.disseminationActions ?? [],
)
const disseminationStatus = ref<Record<string, LogDisseminationStatus>>({})

async function disseminateLog(
  log: LogMessage,
  dissemination: LogDisplayDisseminationAction,
) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const request: LogDisplayLogsActionRequest = {
    logDisplayId: props.logDisplay.id,
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
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const keys: ForecasterNoteKeysRequest = {
    logs: [{ id: log.id, taskRunId: log.taskRunId }],
  }
  await provider.deleteForecasterNote(keys)
  refreshLogs()
}

async function editLog(log: LogMessage) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const note: ForecasterNoteRequest = {
    noteGroupId: noteGroup.value?.id ?? '',
    logMessage: log.text,
    logLevel: log.level,
    id: log.id,
    taskRunId: log.taskRunId,
    userId: log.user,
  }
  await provider.postForecasterNote(note)
  refreshLogs()
}

async function acknowledgeLog(log: LogMessage) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const keys: ForecasterNoteKeysRequest = {
    logs: [{ id: log.id, taskRunId: log.taskRunId }],
  }
  await provider.acknowledgeForecasterNote(keys)
  refreshLogs()
}

async function unacknowledgeLog(log: LogMessage) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const keys: ForecasterNoteKeysRequest = {
    logs: [{ id: log.id, taskRunId: log.taskRunId }],
  }
  await provider.unacknowledgeForecasterNote(keys)
  refreshLogs()
}

function refreshLogs() {
  now.value = new Date()
}

const lastUpdatedString = computed<string>(() => {
  const lastUpdated = lastUpdatedTimestamp.value
  if (lastUpdated === null) return '—'
  return new Date(lastUpdated).toLocaleString()
})
</script>
