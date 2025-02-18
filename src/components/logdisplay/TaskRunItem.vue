<template>
  <v-card border flat density="compact">
    <v-card-text class="py-2 h-100">
      <div class="d-flex gap-2 align-center">
        <v-icon
          class="me-2"
          :icon="getIconForStatus(taskRun?.status)"
          :color="getColorForStatus(taskRun?.status)"
          size="20"
        />
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
      <template v-if="expanded && taskRun">
        <div class="table-container mt-1">
          <table @click.stop class="log-table user-select-text">
            <thead>
              <tr>
                <th>User</th>
                <th>Task run ID</th>
                <th>FSS ID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ taskRun.user ?? 'No user' }}</td>
                <td>{{ taskRun.id }}</td>
                <td>{{ taskRun.fssId }}</td>
              </tr>
            </tbody>
          </table>
          <table @click.stop class="log-table user-select-text">
            <thead>
              <tr>
                <th><span>Time zero</span></th>
                <th><span>Output time span</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ toHumanReadableDate(taskRun.time0) }}</td>
                <td>
                  {{
                    toDateSpanString(
                      taskRun.outputStartTime,
                      taskRun.outputEndTime,
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
          <table @click.stop class="log-table user-select-text">
            <thead>
              <tr>
                <th>Task duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {{
                    toDateSpanString(
                      taskRun.dispatchTime,
                      taskRun.completionTime,
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { TaskRun } from '@deltares/fews-pi-requests'
import {
  logLevels,
  type LogMessage,
  levelToIcon,
  levelToColor,
  logLevelToPiLogLevel,
  manualLogLevels,
} from '@/lib/log'
import { computed } from 'vue'
import { toDateSpanString, toHumanReadableDate } from '@/lib/date'
import {
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

function getIconForStatus(status: string | undefined) {
  return status && isTaskStatus(status)
    ? getIconForTaskStatus(status)
    : 'mdi-bell-outline'
}

function getColorForStatus(status: string | undefined) {
  return status && isTaskStatus(status)
    ? getColorForTaskStatus(status)
    : 'yellow-darken-1'
}
</script>

<style scoped>
.table-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.log-table {
  border-collapse: collapse;
}

.log-table th,
.log-table td {
  text-align: left;
  padding-right: 10px;
}

.log-table td {
  padding-bottom: 5px;
}

.user-select-text {
  user-select: text;
  cursor: text;
}
</style>
