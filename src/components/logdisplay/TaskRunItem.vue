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
              toHumanReadableDate(entryTime)
            }}</v-card-subtitle>
          </div>
          <v-card-subtitle class="pa-0">
            T0: {{ toHumanReadableDate(taskRun?.time0) }}
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
import type { TaskRun } from '@deltares/fews-pi-requests'
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
  toHumanReadableDate,
} from '@/lib/date'
import {
  convertTaskStatusToString,
  getColorForTaskStatus,
  getIconForTaskStatus,
  isTaskStatus,
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

const tableData = computed(() => [
  {
    columns: [
      {
        header: 'User',
        value: props.taskRun?.user ?? 'No user',
      },
      {
        header: 'Task run ID',
        value: props.taskRun?.id,
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
        value: toHumanReadableDate(props.taskRun?.time0),
      },
    ],
  },
  {
    columns: [
      {
        header: `Output time span`,
        subHeader: toDateAbsDifferenceString(
          props.taskRun?.outputStartTime,
          props.taskRun?.outputEndTime,
        ),
        value: toDateRangeString(
          props.taskRun?.outputStartTime,
          props.taskRun?.outputEndTime,
        ),
      },
    ],
  },
  {
    columns: [
      {
        header: 'Task duration',
        subHeader: toDateAbsDifferenceString(
          props.taskRun?.dispatchTime,
          props.taskRun?.completionTime,
        ),
        value: toDateRangeString(
          props.taskRun?.dispatchTime,
          props.taskRun?.completionTime,
        ),
      },
    ],
  },
])

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
