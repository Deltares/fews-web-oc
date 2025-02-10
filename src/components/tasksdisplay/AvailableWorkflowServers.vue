<template>
  <v-list-item prepend-icon="mdi-server" density="compact">
    Number of available servers: {{ formattedNumAvailableServers }}
  </v-list-item>
</template>
<script setup lang="ts">
import { asyncComputed } from '@vueuse/core'

import { useWorkflowRuntime } from '@/services/useWorkflowRuntime'

interface Props {
  workflowId: string | null
}
const props = defineProps<Props>()

const workflowRuntime = useWorkflowRuntime(() => props.workflowId)

const placeholder = '—'
const formattedNumAvailableServers = asyncComputed<string>(async () => {
  const numAvailableServers = workflowRuntime.numAvailableServers.value
  return numAvailableServers?.toString() ?? placeholder
}, placeholder)
</script>
