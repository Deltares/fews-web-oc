<template>
  <div>Expected runtime: {{ formattedRange }}</div>
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
const formattedRange = asyncComputed<string>(async () => {
  const range = await workflowRuntime.getRuntimeRangeInSeconds(5, 95)
  if (range === null) return placeholder
  const [lower, upper] = range
  // TODO: clever formatting based on the durations.
  return `${lower / 60}–${upper / 60} minutes`
}, placeholder)
</script>
