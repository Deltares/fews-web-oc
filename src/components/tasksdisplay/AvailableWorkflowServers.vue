<template>
  Number of available servers: {{ formattedNumAvailableServers }}
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
