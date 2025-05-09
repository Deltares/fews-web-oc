<template>
  <v-data-table-virtual
    density="compact"
    :headers="headers"
    :items="logs"
    class="virtual-table"
    item-height="41"
  >
    <template #header.actions>
      <!-- empty  -->
    </template>
    <template #item.level="{ item }">
      <v-icon class="ms-2" :icon="logToIcon(item)" :color="logToColor(item)" />
    </template>
    <template #item.actions="{ item }">
      <v-menu location="bottom right" max-width="300">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon="mdi-dots-horizontal" density="compact" />
        </template>
        <v-list density="compact">
          <v-list-item
            v-if="item.topologyNodeId"
            :to="logToRoute(item)"
            prepend-icon="mdi-link-variant"
          />
          <v-list-item
            v-for="dissemination in systemDisseminations"
            :prepend-icon="dissemination.iconId"
            :title="dissemination.description"
            :lines="false"
            @click="emit('disseminateLog', item, dissemination)"
          />
        </v-list>
      </v-menu>
    </template>
  </v-data-table-virtual>
</template>

<script setup lang="ts">
import { toHumanReadableDate } from '@/lib/date'
import type { VDataTableVirtual } from 'vuetify/components'
import {
  type LogMessage,
  logToIcon,
  logToColor,
  logToRoute,
  LogActionEmit,
} from '@/lib/log'
import {
  LogDisplayDisseminationAction,
  TaskRun,
} from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  logs: LogMessage[]
  taskRun?: TaskRun
  disseminations: LogDisplayDisseminationAction[]
}

const props = defineProps<Props>()

const systemDisseminations = computed(() =>
  props.disseminations.filter((d) => d.systemLog),
)

const headers = computed<VDataTableVirtual['headers']>(() => {
  const hasDisseminations = systemDisseminations.value.length
  const hasTopologyNodeId = props.logs.some((l) => l.topologyNodeId)
  const actionsHeader =
    hasDisseminations || hasTopologyNodeId
      ? [{ key: 'actions', sortable: false }]
      : []
  return [
    { title: 'Level', key: 'level' },
    {
      title: 'Time',
      width: '160px',
      key: 'entryTime',
      value: (item) => toHumanReadableDate(item.entryTime),
    },
    { title: 'Message', key: 'text' },
    ...actionsHeader,
  ]
})

const emit = defineEmits<LogActionEmit>()
</script>

<style scoped>
.virtual-table {
  max-height: 500px;
  background-color: transparent;
}

/* Hide last border-bottom of the table */
.virtual-table
  :deep(.v-table__wrapper > table > tbody > tr:nth-last-child(2) > td) {
  border-bottom: none !important;
}
</style>
