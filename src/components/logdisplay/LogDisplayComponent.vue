<template>
  <div class="logs-container d-flex flex-column w-100 h-100 pb-2">
    <div class="flex-0-0 d-flex justify-center pt-2">
      <div class="flex-0-0 d-flex ga-2 justify-space-between align-center">
        <v-select
          v-model="selectedLogTypes"
          :items="logTypes"
          label="Log Type"
          variant="outlined"
          clearable
          hide-details
          multiple
          density="compact"
          :item-title="toTitleCase"
          :item-value="(item) => item"
        />
        <v-select
          v-model="selectedLevels"
          :items="logLevels"
          label="Level"
          variant="outlined"
          clearable
          hide-details
          multiple
          density="compact"
          :item-title="levelToTitle"
          :item-value="(item) => item"
        />
        <div class="spacer" />
        <div class="date-input-container">
          <v-date-input
            v-model="endDate"
            label="Date"
            variant="outlined"
            hide-details
            density="compact"
            prepend-icon=""
          />
        </div>
        <v-text-field
          v-model.number="daysBack"
          label="Days back"
          variant="outlined"
          hide-details
          density="compact"
          validate-on="input"
          :max="365"
          :min="1"
          max-width="80px"
        />
        <v-text-field
          v-model.number="maxCount"
          label="Request count"
          variant="outlined"
          hide-details
          density="compact"
          validate-on="input"
          max-width="100px"
          :max="1000"
          :min="1"
        />
      </div>
    </div>
    <div class="flex-0-0 d-flex justify-center py-2">
      <div class="flex-0-0 d-flex ga-2 align-center">
        <v-text-field
          v-model="search"
          placeholder="Search"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
          density="compact"
          max-width="400px"
          min-width="200px"
        />
        <span>Total: {{ logMessages.length }}</span>
        <v-btn
          @click="refreshLogs"
          icon="mdi-refresh"
          density="compact"
          :loading="isLoading"
        />
        <NewLogMessageDialog
          v-if="noteGroup"
          :noteGroup="noteGroup"
          @newNote="refreshLogs"
        />
      </div>
    </div>

    <!-- Important to have item-height as it greatly improves performance -->
    <v-virtual-scroll
      class="scroll-container"
      :items="groupedByTaskRunId"
      :item-height="50"
    >
      <template #default="{ item: logs }">
        <LogItem
          :logs="logs"
          :taskRuns="taskRuns"
          :disseminations="disseminations"
          :userName="userName"
          @disseminate-log="disseminateLog"
        />
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VDateInput } from 'vuetify/labs/components'
import LogItem from './LogItem.vue'
import {
  type LogType,
  type LogLevel,
  logLevels,
  filterLog,
  getSystemFilters,
  getManualFilters,
  logTypes,
  toTitleCase,
  LogMessage,
  levelToTitle,
} from '@/lib/log'
import type {
  ForecasterNoteGroup,
  LogDisplayDisseminationAction,
  LogsDisplay,
} from '@deltares/fews-pi-requests'
import { useLogDisplayLogs } from '@/services/useLogDisplayLogs'
import { configManager } from '@/services/application-config'
import { debouncedRef } from '@vueuse/core'
import { useCurrentUser } from '@/services/useCurrentUser'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import NewLogMessageDialog from './NewLogMessageDialog.vue'
import { useTaskRuns } from '@/services/useTaskRuns'

interface Props {
  logDisplay: LogsDisplay
  noteGroup?: ForecasterNoteGroup
}

const props = defineProps<Props>()

const search = ref<string>()
const maxCount = ref<number>(1000)
const selectedLevels = ref<LogLevel[]>([])
const selectedLogTypes = ref<LogType[]>([])

const daysBack = ref<number>(7)
const DAY_IN_MS = 1000 * 60 * 60 * 24
const startDate = computed(
  () => new Date(endDate.value.getTime() - daysBack.value * DAY_IN_MS),
)
const endDate = ref<Date>(new Date())

const { userName } = useCurrentUser()

const baseFilters = computed(() => {
  const startTime = convertJSDateToFewsPiParameter(startDate.value)
  const endTime = convertJSDateToFewsPiParameter(endDate.value)
  return {
    logDisplayId: props.logDisplay.id,
    maxCount: maxCount.value,
    startTime,
    endTime,
  }
})

const manualFilters = computed(() => {
  const manualEventCodeId = props.noteGroup?.note.eventCodeId
  return manualEventCodeId
    ? getManualFilters(baseFilters.value, manualEventCodeId)
    : []
})

const systemFilters = computed(() => {
  const systemLogSettings = props.logDisplay.systemLog
  return systemLogSettings
    ? getSystemFilters(baseFilters.value, systemLogSettings)
    : []
})

const requestDebounce = 500
const debouncedManualFilters = debouncedRef(manualFilters, requestDebounce)
const debouncedSystemFilters = debouncedRef(systemFilters, requestDebounce)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { logMessages: manualLogMessages, isLoading: manualIsLoading } =
  useLogDisplayLogs(baseUrl, debouncedManualFilters)
const { logMessages: systemLogMessages, isLoading: systemIsLoading } =
  useLogDisplayLogs(baseUrl, debouncedSystemFilters)

const logMessages = computed(() =>
  [...manualLogMessages.value, ...systemLogMessages.value].toSorted((a, b) =>
    b.entryTime.localeCompare(a.entryTime),
  ),
)

const isLoading = computed(() => manualIsLoading.value || systemIsLoading.value)

const filterDebounce = 100
const debouncedSelectedLevels = debouncedRef(selectedLevels, filterDebounce)
const debouncedSelectedLogTypes = debouncedRef(selectedLogTypes, filterDebounce)
const debouncedSearch = debouncedRef(search, filterDebounce)

const filteredLogMessages = computed(() =>
  logMessages.value.filter((log) =>
    filterLog(
      log,
      debouncedSelectedLevels.value,
      debouncedSelectedLogTypes.value,
      debouncedSearch.value,
    ),
  ),
)

const groupedByTaskRunId = computed(() => {
  return Object.values(
    filteredLogMessages.value.reduce(
      (grouped, log) => {
        // In case of manual don't group
        const taskRunId =
          log.type === 'system'
            ? log.taskRunId
            : `${log.taskRunId}-${log.id}-${log.user}`
        if (!grouped[taskRunId]) {
          grouped[taskRunId] = []
        }
        grouped[taskRunId].push(log)
        return grouped
      },
      {} as Record<string, LogMessage[]>,
    ),
  ) as LogMessage[][]
})

const taskRunIds = computed(() =>
  groupedByTaskRunId.value.map((logs) => logs[0].taskRunId),
)

const { taskRuns } = useTaskRuns(baseUrl, taskRunIds)

const disseminations = computed(() => {
  return props.logDisplay.logDissemination
    ? props.logDisplay.logDissemination.disseminationActions
    : []
})

function disseminateLog(
  log: LogMessage,
  dissemination: LogDisplayDisseminationAction,
) {
  console.log('Disseminating log', log, dissemination)
}

function refreshLogs() {
  // Set endDate to now + 5 seconds to ensure the backend will return the latest logs
  endDate.value = new Date(new Date().getTime() + 5000)
}
</script>

<style scoped>
.current-user-message {
  border-radius: 12px 12px 0 12px;
  text-align: left;
}

.other-message {
  border-radius: 12px 12px 12px 0;
  text-align: left;
}

.scroll-container {
  overflow-y: auto;
  width: 100%;
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
}

.logs-container > * > * {
  width: clamp(400px, calc(100% - 10px), 1100px);
}

.date-iterator-container > :not([class]) {
  height: 100%;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding-right: 0;
}

.expand-icon-container {
  display: flex;
  align-items: center;
  margin-right: 1px;
  opacity: 0;
  transition: opacity 0.1s;
}

.v-expansion-panel-title:hover .expand-icon-container {
  opacity: 1;
}

.half-height {
  max-height: 50vh;
}

.date-input-container {
  max-width: 120px;
  min-width: 50px;
  flex: 1 1 auto;
}

:deep(.v-expansion-panel-title__overlay) {
  background-color: transparent;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0;
  padding-bottom: 5px;
}

.spacer {
  flex-grow: 0.5;
}
</style>
