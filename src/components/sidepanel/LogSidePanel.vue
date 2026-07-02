<template>
  <SidePanelContent
    :title="t('sidePanel.logDisplay')"
    @close="emit('close')"
    class="h-100"
  >
    <div class="d-flex align-center w-100">
      <div v-if="!isSearchVisible" class="d-flex pa-2 ga-2 w-100 align-center">
        <v-btn density="compact" icon @click="toggleSearch" class="ms-1">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
        <LogTypeFilter
          v-if="manualFilters.length && systemFilters.length"
          v-model="selectedLogTypes"
        />
        <v-spacer />
        <PeriodFilterControl v-model="period" :hasAllOption="false" />
      </div>
      <v-text-field
        v-else
        ref="searchField"
        v-model="search"
        placeholder="Search"
        variant="outlined"
        clearable
        single-line
        hide-details
        class="px-1 py-1"
        density="compact"
        @keydown.esc="toggleSearch"
      >
        <template #prepend-inner>
          <v-icon color="blue" @click="toggleSearch">mdi-magnify</v-icon>
        </template>
      </v-text-field>
    </div>
    <div class="position-relative d-flex flex-1-1 overflow-y-auto">
      <div
        class="log-level-filter-overlay d-flex w-100 justify-center py-2"
        :class="{ hidden: shouldHideFilter && !isSearchVisible }"
        @mouseenter="handleFilterMouseEnter"
        @mouseleave="scheduleHideFilter"
      >
        <v-sheet>
          <LogLevelFilter v-model="selectedLevels" />
        </v-sheet>
      </div>
      <v-virtual-scroll
        ref="virtualScroll"
        class="w-100 px-1 pb-1"
        :items="groupedByTaskRunId"
        :item-height="50"
        @scroll="scheduleHideFilter"
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
    <div class="pa-2">
      <NewLogMessage
        v-if="noteGroup"
        :noteGroup="noteGroup"
        @newNote="refreshLogs"
      />
    </div>
    <v-divider />
    <v-footer class="d-flex flex-0-0">
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
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  type LogDisplayDisseminationAction,
  type TopologyNode,
} from '@deltares/fews-pi-requests'

import {
  logLevels,
  logTypes,
  type LogLevel,
  type LogMessage,
  type LogType,
} from '@/lib/log/types'

import SidePanelContent from './SidePanelContent.vue'
import LogItem from '@/components/logdisplay/LogItem.vue'
import LogLevelFilter from '@/components/logdisplay/LogLevelFilter.vue'
import LogTypeFilter from '@/components/logdisplay/LogTypeFilter.vue'
import DateSeparator from '@/components/logdisplay/DateSeparator.vue'
import PeriodFilterControl from '@/components/tasks/PeriodFilterControl.vue'
import NewLogMessage from '@/components/logdisplay/NewLogMessage.vue'

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
import { useNoteGroup } from '@/services/useNoteGroup/index.ts'
import { useLogActions } from '@/components/logdisplay/useLogActions'

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
const { workflows } = useAvailableWorkflowsStore()

const period = ref<RelativePeriod | null>({
  startOffsetSeconds: -24 * 60 * 60,
  endOffsetSeconds: 0,
})

const search = ref<string>()
const maxCount = ref<number>(20000)
const selectedLevels = ref<LogLevel[]>([...logLevels])
const selectedLogTypes = ref<LogType[]>([...logTypes])
const expandedItems = ref<Record<string, boolean>>({})
const isSearchVisible = ref<boolean>(false)
const searchField = ref<HTMLElement | null>(null)
const shouldHideFilter = ref<boolean>(false)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

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

const customFilter = (log: LogMessage) =>
  Boolean(
    filterLog(
      log,
      debouncedSelectedLevels.value,
      debouncedSelectedLogTypes.value,
      debouncedSearch.value,
      taskRuns.value,
      workflows,
    ),
  )

const { logMessages, isLoading, lastUpdatedTimestamp, groupedByTaskRunId } =
  useLogDisplayLogs(baseUrl, () => debouncedFilters.value, customFilter, false)

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

function refreshLogs() {
  now.value = new Date()
}

const {
  disseminationStatus,
  disseminateLog,
  deleteLog,
  editLog,
  acknowledgeLog,
  unacknowledgeLog,
} = useLogActions({
  baseUrl,
  getLogDisplayId: () => props.settings.logDisplayId,
  getNoteGroupId: () => noteGroup.value?.id ?? '',
  onRefresh: refreshLogs,
})

async function toggleSearch() {
  isSearchVisible.value = !isSearchVisible.value
  if (isSearchVisible.value) {
    await nextTick()
    ;(searchField.value as any)?.$el?.querySelector('input')?.focus()
  } else {
    search.value = undefined
  }
}

function scheduleHideFilter() {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
  hideTimeout = setTimeout(() => {
    shouldHideFilter.value = true
  }, 1000)
}

function handleFilterMouseEnter() {
  shouldHideFilter.value = false
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
}

const lastUpdatedString = computed<string>(() => {
  const lastUpdated = lastUpdatedTimestamp.value
  if (lastUpdated === null) return '—'
  return new Date(lastUpdated).toLocaleString()
})
</script>

<style scoped>
.log-level-filter-overlay {
  position: absolute;
  bottom: 0;
  z-index: 10;
  transition: opacity 0.2s ease-in-out;
}

.log-level-filter-overlay.hidden {
  opacity: 0;
}

.filter-spacer {
  height: 50px;
  min-height: 50px;
}
</style>
