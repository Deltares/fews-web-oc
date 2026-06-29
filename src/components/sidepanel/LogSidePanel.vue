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
        <template v-else-if="item.type === 'logItem'">
          <TaskRunItem
            :entryTime="item.logs[0].entryTime"
            :taskRun="taskRunForLog(item.logs[0])"
            :logs="item.logs"
            :expanded="true"
            class="mt-2"
            :ripple="false"
          >
            <template
              #expansion="{
                expanded: slotExpanded,
                logs: slotLogs,
                taskRun: slotTaskRun,
              }"
            >
              <LogDetails
                v-if="slotExpanded"
                :logs="slotLogs"
                :taskRun="slotTaskRun"
                :disseminations="disseminations"
                :disseminationStatus="disseminationStatus"
                :userName="preferredUsername"
                v-bind="$attrs"
              />
            </template>
          </TaskRunItem>
        </template>
      </template>
    </v-virtual-scroll>
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
import TaskRunItem from '@/components/logdisplay/TaskRunItem.vue'
import LogDetails from '@/components/logdisplay/LogDetails.vue'
import LogLevelFilter from '@/components/logdisplay/LogLevelFilter.vue'
import DateSeparator from '@/components/logdisplay/DateSeparator.vue'
import PeriodFilterControl from '@/components/tasks/PeriodFilterControl.vue'

import { refDebounced } from '@vueuse/core'
import { configManager } from '@/services/application-config'
import { useLogDisplayLogs } from '@/services/useLogDisplayLogs'
import { filterLog, getManualFilters, getSystemFilters } from '@/lib/log/utils'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import { useLogDisplay } from '@/services/useLogDisplay'
import { useCurrentUser } from '@/services/useCurrentUser'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { useTaskRuns } from '@/services/useTaskRuns'
import { RelativePeriod } from '@/lib/period/types.ts'

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

const requestDebounce = 500

const filterDebounce = 100
const debouncedSelectedLevels = refDebounced(selectedLevels, filterDebounce)
const debouncedSelectedLogTypes = refDebounced(selectedLogTypes, filterDebounce)
const debouncedSearch = refDebounced(search, filterDebounce)
const now = ref(new Date())


const baseFilters = computed(() => {
  const start = new Date(
    now.value.getTime() + (period.value?.startOffsetSeconds ?? -24 * 60 * 60) * 1000,
  )
  const end = new Date(now.value.getTime() + (period.value?.endOffsetSeconds ?? 0) * 1000)
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
  const manualEventCodeId = false
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

const taskRunForLog = (log: LogMessage) =>
  taskRuns.value.find((taskRun) => taskRun.taskRunId === log.taskRunId)

async function refreshLogs() {
  now.value = new Date()
}

const lastUpdatedString = computed<string>(() => {
  const lastUpdated = lastUpdatedTimestamp.value
  if (lastUpdated === null) return '—'
  return new Date(lastUpdated).toLocaleString()
})
</script>
