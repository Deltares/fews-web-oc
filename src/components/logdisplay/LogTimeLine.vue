<template>
  <v-timeline
    side="end"
    density="compact"
    truncate-line="end"
    class="ps-4 pe-2"
  >
    <v-timeline-item v-for="log in logs" :key="log.id" size="0">
      <template #icon>
        <v-icon
          :icon="levelToIcon(log.level)"
          :color="levelToColor(log.level)"
          size="small"
        />
      </template>
      <div class="d-flex flex-column log_item__content">
        <div class="text-body-medium">{{ log.text }}</div>
        <div class="d-flex align-center ga-1">
          <span class="text-label-large text-medium-emphasis">{{
            toHumanReadableDateTime(log.entryTime)
          }}</span>
          <v-menu
            v-if="log.topologyNodeId || systemDisseminations.length"
            location="bottom right"
            max-width="300"
            :close-on-content-click="false"
          >
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                icon
                density="compact"
                size="small"
              >
                <v-icon size="x-small">mdi-dots-horizontal</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                v-if="log.topologyNodeId"
                :to="logToRoute(log)"
                prepend-icon="mdi-link-variant"
              />
              <LogDisseminations
                :log="log"
                :disseminations="systemDisseminations"
                :disseminationStatus="props.disseminationStatus"
                @disseminate-log="
                  (log, dis) => emit('disseminateLog', log, dis)
                "
              />
            </v-list>
          </v-menu>
        </div>
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
  logToRoute,
  type LogActionEmit,
  type LogDisseminationStatus,
  type LogMessage,
} from '@/lib/log'
import type { TaskRun } from '@/lib/taskruns'
import { toHumanReadableDateTime } from '@/lib/date'
import { computed } from 'vue'
import LogDisseminations from '@/components/logdisplay/LogDisseminations.vue'

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

const systemDisseminations = computed(() =>
  props.disseminations.filter((d) => d.systemLog),
)
</script>
