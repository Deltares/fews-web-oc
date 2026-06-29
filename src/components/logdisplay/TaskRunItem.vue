<template>
  <v-card border flat density="compact">
    <div class="pa-0 h-100 log-item">
      <v-card
        flat
        class="d-flex align-center px-2 ga-2 w-100"
        @click="onExpansionPanelToggle"
        @dblclick.prevent
      >
        <v-tooltip>
          <template #activator="{ props }">
            <v-icon
              class="me-2 flex-0-0"
              :icon="getIconForStatus(taskRun?.status)"
              :color="getColorForStatus(taskRun?.status)"
              size="20"
              v-bind="props"
            />
          </template>
          <span>{{ getStringForStatus(taskRun?.status) }}</span>
        </v-tooltip>
        <div
          class="py-2 w-100 user-select-text cursor-pointer"
          style="max-width: calc(100% - 40px)"
        >
          <div class="d-flex align-center ga-2">
            <v-list-item-title class="text-truncate">
              {{ title }}
            </v-list-item-title>
            <v-card-subtitle class="pa-0 wide-only">{{
              toHumanReadableDateTime(entryTime)
            }}</v-card-subtitle>
          </div>
          <div class="d-flex align-center ga-2 flex-wrap">
            <div class="d-flex flex-column ga-1">
              <v-card-subtitle class="pa-0 narrow-only">{{
                toHumanReadableDateTime(entryTime)
              }}</v-card-subtitle>
              <v-card-subtitle class="pa-0">
                T0: {{ toHumanReadableDateTime(taskRun?.timeZeroTimestamp) }}
              </v-card-subtitle>
            </div>
            <div
              class="d-flex align-center ga-2 flex-wrap ms-auto log-item__chips-wrap"
            >
              <template
                v-for="level in manualLogLevels.toReversed()"
                :key="level"
              >
                <v-chip
                  v-if="levelCount[logLevelToPiLogLevel(level)]"
                  :prepend-icon="levelToIcon(level)"
                  :text="levelCount[logLevelToPiLogLevel(level)].toString()"
                  :color="levelToColor(level)"
                  label
                  density="compact"
                  class="ms-0"
                />
              </template>
            </div>
          </div>
        </div>
      </v-card>
      <slot
        name="expansion"
        :expanded="expanded"
        :logs="logs"
        :taskRun="taskRun"
      >
        <DataTable
          v-if="expanded && taskRun"
          class="mt-4 wide-only"
          :tableData="tableData"
        />
      </slot>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import DataTable from '@/components/general/DataTable.vue'
import {
  type LogMessage,
  levelToIcon,
  levelToColor,
  logLevelToPiLogLevel,
  manualLogLevels,
} from '@/lib/log'
import { computed, ref } from 'vue'
import {
  toDateAbsDifferenceString,
  toDateRangeString,
  toHumanReadableDateTime,
} from '@/lib/date'
import {
  convertTaskStatusToString,
  getColorForTaskStatus,
  getIconForTaskStatus,
  isTaskStatus,
  type TaskRun,
} from '@/lib/taskruns'

interface Props {
  title?: string
  entryTime?: string
  taskRun?: TaskRun
  logs: LogMessage[]
}

const props = defineProps<Props>()

const emit = defineEmits(['disseminateLog'])

const expanded = ref(false)

const levelCount = computed(() =>
  props.logs.reduce(
    (acc, log) => {
      acc[log.level] = (acc[log.level] ?? 0) + 1
      return acc
    },
    {} as Record<LogMessage['level'], number>,
  ),
)

const tableData = computed(() => {
  const timeZero = props.taskRun?.timeZeroTimestamp
  const outputStart = props.taskRun?.outputStartTimestamp ?? timeZero
  const outputEnd = props.taskRun?.outputEndTimestamp ?? timeZero
  return [
    {
      columns: [
        {
          header: 'User',
          value: props.taskRun?.userId ?? 'No user',
        },
        {
          header: 'Task run ID',
          value: props.taskRun?.taskRunId,
        },
        {
          header: 'FSS ID',
          value: props.taskRun?.fssId,
        },
      ],
    },
    {
      columns: [
        {
          header: 'T0',
          value: toHumanReadableDateTime(props.taskRun?.timeZeroTimestamp),
        },
      ],
    },
    {
      columns: [
        {
          header: `Output time span`,
          subHeader: toDateAbsDifferenceString(outputStart, outputEnd),
          value: toDateRangeString(outputStart, outputEnd),
        },
      ],
    },
    {
      columns: [
        {
          header: 'Task duration',
          subHeader: toDateAbsDifferenceString(
            props.taskRun?.dispatchTimestamp,
            props.taskRun?.completionTimestamp,
          ),
          value: toDateRangeString(
            props.taskRun?.dispatchTimestamp,
            props.taskRun?.completionTimestamp,
          ),
        },
      ],
    },
  ]
})

function getIconForStatus(status: string | undefined) {
  return status && isTaskStatus(status)
    ? getIconForTaskStatus(status)
    : 'mdi-help-circle-outline'
}

function getStringForStatus(status: string | undefined) {
  return status && isTaskStatus(status)
    ? convertTaskStatusToString(status)
    : 'Unknown status'
}

function getColorForStatus(status: string | undefined) {
  return status && isTaskStatus(status)
    ? getColorForTaskStatus(status)
    : 'yellow-darken-1'
}

function onExpansionPanelToggle(event: MouseEvent) {
  const selectedText = globalThis.getSelection?.()?.toString().trim()

  // Do not toggle when click concludes a text selection gesture.
  if (selectedText) return

  // Ignore subsequent clicks in a double-click sequence.
  if (event.detail > 1) return
  expanded.value = !expanded.value
}
</script>

<style scoped>
.log-item {
  container-type: inline-size;
}

.narrow-only {
  display: none;
}

@container (max-width: 500px) {
  .wide-only {
    display: none;
  }

  .narrow-only {
    display: inherit;
  }
}
</style>
