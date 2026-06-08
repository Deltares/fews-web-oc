<template>
  <v-timeline side="end" density="compact"  truncate-line="end">
    <v-timeline-item
      v-for="log in logs"
      :key="log.id"
      dot-color="none"
      size="0"
    >
      <template #icon>
        <v-icon
          :icon="levelToIcon(log.level)"
          :color="levelToColor(log.level)"
          size="large"
        />
      </template>
      <div class="d-flex flex-column log_item__content">
        <div class="log-item__text">{{ log.text }}</div>
        <span class="text-caption text-medium-emphasis">{{
          toHumanReadableDateTime(log.entryTime)
        }}</span>
      </div>
    </v-timeline-item>
  </v-timeline>
</template>

<script setup lang="ts">
import type {
  ForecasterNoteGroup,
  LogDisplayDisseminationAction,
} from '@deltares/fews-pi-requests'
import {
  levelToColor,
  levelToIcon,
  type LogActionEmit,
  type LogDisseminationStatus,
  type LogMessage,
} from '@/lib/log'
import type { TaskRun } from '@/lib/taskruns'
import { toHumanReadableDateTime } from '@/lib/date'

interface Props {
  userName: string
  noteGroup?: ForecasterNoteGroup
  logs: LogMessage[]
  taskRuns: TaskRun[]
  disseminations: LogDisplayDisseminationAction[]
  disseminationStatus: Record<string, LogDisseminationStatus>
}

const props = defineProps<Props>()

const emit = defineEmits<LogActionEmit>()
</script>

<style>
.v-timeline .v-timeline-divider__dot {
  background-color: transparent;
}

.log-item__text {
  font-size: 0.875rem;
  word-break: break-all;
}
</style>
