<template>
  <div class="w-100">
    <v-card border flat density="compact">
      <v-card-text class="py-2">
        <div class="d-flex gap-2 align-center">
          <v-icon class="me-2" :icon="getIconForStatus(taskRun?.status)" size="20" />
          <v-list-item-title>{{ title }}</v-list-item-title>
          <v-card-subtitle class="ps-2">T0: {{
            toHumanReadableDate(taskRun?.time0)
          }}</v-card-subtitle>
          <v-spacer />
          <template v-for="level in logLevels.toReversed()">
            <v-chip
              v-if="levelCount[level]"
              :prepend-icon="levelToIcon(level)"
              :text="levelCount[level].toString()"
              :color="levelToColor(level)"
              label
              density="compact"
              class="ms-2"
            />
          </template>
        </div>
        <template v-if="expanded">
          <div class="table-container">
            <table class="log-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Task run ID</th>
                  <th>FSS ID</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ taskRun?.user ?? 'No user' }}</td>
                  <td>{{ taskRun?.id }}</td>
                  <td>{{ taskRun?.fssId }}</td>
                </tr>
              </tbody>
            </table>
            <table class="log-table">
              <thead>
                <tr>
                  <th>Time zero</th>
                  <th>Output time span</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ toHumanReadableDate(taskRun?.time0) }}</td>
                  <td>
                    {{
                      toDateSpanString(
                        taskRun?.outputStartTime,
                        taskRun?.outputEndTime,
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
            <table class="log-table">
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
                        taskRun?.dispatchTime,
                        taskRun?.completionTime,
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
  </div>
</template>

<script setup lang="ts">
import type { TaskRun } from '@deltares/fews-pi-requests'
import {
  logLevels,
  type LogMessage,
  levelToIcon,
  levelToColor,
} from '@/lib/log'
import { computed } from 'vue'
import { toDateSpanString, toHumanReadableDate } from '@/lib/date'

interface Props {
  title?: string
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
  switch (status) {
    case 'pending':
      return 'mdi-human-queue'
    case 'running':
      return 'mdi-run'
    case 'completed':
      return 'mdi-check'
    case 'failed':
      return 'mdi-alert-circle'
    case 'approved':
      return 'mdi-check'
  }
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
</style>
