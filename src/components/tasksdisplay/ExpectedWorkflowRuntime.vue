<template>
  <div>Expected runtime: {{ formattedRuntime }}</div>
</template>
<script setup lang="ts">
import { useWorkflowRuntime } from '@/services/useWorkflowRuntime'
import { asyncComputed } from '@vueuse/core'

interface Props {
  workflowId: string | null
}
const props = defineProps<Props>()

const workflowRuntime = useWorkflowRuntime(() => props.workflowId)

const placeholder = '—'
const formattedRuntime = asyncComputed<string>(async () => {
  const runtime = workflowRuntime.runtimeInSeconds.value
  if (runtime === null) return placeholder
  // TODO: clever formatting based on the durations.
  const formattedRuntime = (runtime / 60).toFixed(1)
  return `${formattedRuntime} minutes`
}, placeholder)
</script>
