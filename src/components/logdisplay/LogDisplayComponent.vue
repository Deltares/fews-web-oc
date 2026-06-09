<template>
  <div class="w-100 h-100 d-flex flex-column">
    <v-navigation-drawer v-model="showFilters" right width="350">
      <v-list>
        <template v-if="manualFilters.length && systemFilters.length">
          <v-list-subheader>Types</v-list-subheader>
          <v-list-item>
            <v-select
              v-if="manualFilters.length && systemFilters.length"
              v-model="selectedLogTypes"
              :items="logTypes"
              variant="outlined"
              hide-details
              clearable
              density="compact"
              :item-title="toTitleCase"
              :item-value="(item) => item"
            />
          </v-list-item>
        </template>

        <v-list-subheader>Levels</v-list-subheader>
        <v-list-item>
          <v-select
            v-model="selectedLevels"
            :items="logLevels"
            variant="outlined"
            chips
            closable-chips
            hide-details
            multiple
            density="compact"
            :item-title="levelToTitle"
            :item-value="(item) => item"
          >
            <template #chip="{ item }">
              <v-chip
                :color="levelToColor(item)"
                label
                :prepend-icon="levelToIcon(item)"
              >
                {{ levelToTitle(item) }}
              </v-chip>
            </template>
          </v-select>
        </v-list-item>
        <v-list-subheader>Date</v-list-subheader>
        <v-list-item>
          <v-date-input
            v-model="endDate"
            variant="outlined"
            hide-details
            density="compact"
            prepend-icon=""
          />
        </v-list-item>
        <v-list-subheader>Days back</v-list-subheader>
        <v-list-item>
          <v-number-input
            v-model.number="daysBack"
            variant="outlined"
            hide-details
            density="compact"
            validate-on="input"
            :max="365"
            :min="1"
          />
        </v-list-item>
        <v-list-subheader>Limit</v-list-subheader>
        <v-list-item>
          <v-number-input
            v-model.number="maxCount"
            variant="outlined"
            hide-details
            density="compact"
            validate-on="input"
            :step="10000"
            :min="1"
          />
        </v-list-item>
      </v-list>
      <v-footer>
        <v-spacer />
      </v-footer>
    </v-navigation-drawer>
    <v-toolbar density="compact">
      <v-btn
        icon
        @click="showFilters = !showFilters"
        :aria-label="showFilters ? 'Hide filters' : 'Show filters'"
      >
        <v-icon>{{ showFilters ? 'mdi-menu-open' : 'mdi-menu-close' }}</v-icon>
      </v-btn>
      <v-spacer />
      <v-btn @click="refreshLogs" :loading="isLoading" icon="mdi-refresh">
      </v-btn>
      <span class="mx-2">Total:</span>
      <span style="width: 4rem"> {{ logMessages.length }}</span>
    </v-toolbar>
    <div class="logs-container">
      <div class="flex-0-0 d-flex justify-center py-2">
        <div class="flex-0-0 d-flex flex-column ga-2 align-left">
          <NewLogMessage
            v-if="noteGroup"
            :noteGroup="noteGroup"
            @newNote="refreshLogs"
          />
          <v-text-field
            v-model="search"
            placeholder="Search"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            rounded
            clearable
            hide-details
            density="compact"
          />
        </div>
      </div>
      <v-virtual-scroll
        class="scroll-container h-100"
        :items="groupedByTaskRunId"
        :item-height="50"
        v-if="groupedByTaskRunId.length"
      >
        <template #default="{ item }">
          <DateSeparator
            v-if="item.type === 'dateSeparator'"
            :date="item.date"
          />
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { VDateInput } from 'vuetify/labs/components'
import LogItem from './LogItem.vue'
import DateSeparator from './DateSeparator.vue'
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
  LogDisseminationStatus,
  getLogDisseminationKey,
  levelToColor,
  levelToIcon,
} from '@/lib/log'
import {
  ForecasterNoteKeysRequest,
  ForecasterNoteRequest,
  LogDisplayLogsActionRequest,
  PiWebserviceProvider,
  type ForecasterNoteGroup,
  type LogDisplayDisseminationAction,
  type LogsDisplay,
} from '@deltares/fews-pi-requests'
import { useLogDisplayLogs } from '@/services/useLogDisplayLogs'
import { configManager } from '@/services/application-config'
import { refDebounced } from '@vueuse/core'
import { useCurrentUser } from '@/services/useCurrentUser'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import NewLogMessage from './NewLogMessage.vue'
import { useTaskRuns } from '@/services/useTaskRuns'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'

interface Props {
  logDisplay: LogsDisplay
  noteGroup?: ForecasterNoteGroup
}

const props = defineProps<Props>()
const { mobile } = useDisplay()

const showFilters = ref<boolean>(!mobile.value)

const search = ref<string>()
const maxCount = ref<number>(20000)
const selectedLevels = ref<LogLevel[]>([...logLevels])
const selectedLogTypes = ref<LogType | null>(null)

const daysBack = ref<number>(2)
const DAY_IN_MS = 1000 * 60 * 60 * 24
const startDate = computed(
  () => new Date(endDate.value.getTime() - daysBack.value * DAY_IN_MS),
)
const endDate = ref<Date>(new Date())

const expandedItems = ref<Record<string, boolean>>({})
watch(
  () => props.logDisplay,
  () => {
    expandedItems.value = {}
  },
)

const { preferredUsername } = useCurrentUser()
const { workflows } = useAvailableWorkflowsStore()

const baseFilters = computed(() => {
  const startTime = convertJSDateToFewsPiParameter(startDate.value)
  // Set endTime to 23:59:59 of the endDate
  endDate.value.setHours(23, 59, 59, 999)
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

// To keep requests in sync between manual and system logs
const filters = computed(() => {
  const hasManual = props.logDisplay.manualLog
  const hasSystem = props.logDisplay.systemLog
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

const requestDebounce = 500
const debouncedFilters = refDebounced(filters, requestDebounce)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filterDebounce = 100
const debouncedSelectedLevels = refDebounced(selectedLevels, filterDebounce)
const debouncedSelectedLogTypes = refDebounced(selectedLogTypes, filterDebounce)
const debouncedSearch = refDebounced(search, filterDebounce)

const customFilter = (log: LogMessage) =>
  Boolean(
    filterLog(
      log,
      debouncedSelectedLevels.value,
      debouncedSelectedLogTypes.value ? [debouncedSelectedLogTypes.value] : [],
      debouncedSearch.value,
      taskRuns.value,
      workflows,
    ),
  )

const { logMessages, isLoading, groupedByTaskRunId } = useLogDisplayLogs(
  baseUrl,
  () => debouncedFilters.value,
  customFilter,
)

const taskRunIds = computed(() => {
  const _taskRunIds = logMessages.value.map((logs) => logs.taskRunId)
  const uniqueTaskRunIds = Array.from(new Set(_taskRunIds))
  return uniqueTaskRunIds
})

const { taskRuns } = useTaskRuns(baseUrl, () => ({
  taskRunIds: taskRunIds.value,
}))

const disseminations = computed(
  () => props.logDisplay.logDissemination?.disseminationActions ?? [],
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
    noteGroupId: props.noteGroup?.id ?? '',
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

async function refreshLogs() {
  // Set endDate to now + 5 seconds to ensure the backend will return the latest logs
  endDate.value = new Date(Date.now() + 5000)
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

.logs-container {
  height: calc(100% - 104px);
}

.logs-container > * > * {
  width: clamp(400px, calc(100% - 10px), 1100px);
}

.date-iterator-container > :not([class]) {
  height: 100%;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0px 0px 5px 0px;
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

.spacer {
  flex-grow: 0.5;
}

.logs-filter {
  max-width: 200px;
}
</style>
