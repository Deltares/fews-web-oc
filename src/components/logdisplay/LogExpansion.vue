<template>
  <v-data-table-virtual :headers="headers" :items="logs">
    <template v-slot:item.level="{ item }">
      <v-icon :icon="logToIcon(item)" :color="logToColor(item)" />
    </template>
  </v-data-table-virtual>
</template>

<script setup lang="ts">
import { toHumanReadableDate } from '@/lib/date'
import type { VDataTableVirtual } from 'vuetify/components'
import { type LogMessage, logToIcon, logToColor } from '@/lib/log'
import {
  LogDisplayDisseminationAction,
  TaskRun,
} from '@deltares/fews-pi-requests'

interface Props {
  logs: LogMessage[]
  taskRun?: TaskRun
  disseminations: LogDisplayDisseminationAction[]
}

defineProps<Props>()

const headers: VDataTableVirtual['headers'] = [
  { title: 'Level', key: 'level' },
  {
    title: 'Time',
    key: 'entryTime',
    value: (item) => toHumanReadableDate(item.entryTime),
  },
  { title: 'Message', key: 'text' },
]

const emit = defineEmits(['disseminateLog'])
</script>
