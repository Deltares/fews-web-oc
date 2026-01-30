<template>
  <v-card border flat density="compact">
    <v-card-text class="py-2 h-100">
      <div class="d-flex gap-2 align-center">
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
        <div class="d-flex flex-column user-select-text cursor-pointer">
          <div class="d-flex align-center ga-2">
            <v-list-item-title>
              {{ title }}
            </v-list-item-title>
            <v-card-subtitle class="pa-0">{{
              toHumanReadableDateTime(entryTime)
            }}</v-card-subtitle>
          </div>
          <v-card-subtitle class="pa-0">
            T0: {{ toHumanReadableDateTime(taskRun?.timeZeroTimestamp) }}
          </v-card-subtitle>
        </div>
        <v-spacer />
        <template v-for="level in manualLogLevels.toReversed()">
          <v-chip
            v-if="levelCount[logLevelToPiLogLevel(level)]"
            :prepend-icon="levelToIcon(level)"
            :text="levelCount[logLevelToPiLogLevel(level)].toString()"
            :color="levelToColor(level)"
            label
            density="compact"
            class="ms-2"
          />
        </template>
      </div>
      <DataTable
        v-if="expanded && taskRun"
        class="mt-4"
        :tableData="tableData"
      />
    </v-card-text>
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
import { computed } from 'vue'
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
  expanded: boolean
}

const props = defineProps<Props>()

const emit = defineEmits(['disseminateLog'])

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
          value: props.taskRun?.taskId,
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
    : 'mdi-bell-outline'
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
</script>
