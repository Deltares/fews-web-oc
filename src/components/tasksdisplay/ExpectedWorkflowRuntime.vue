<template>
  <div>Expected runtime: {{ formattedRuntime }}</div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

import { useWorkflowRuntime } from '@/services/useWorkflowRuntime'

interface Props {
  workflowId: string | null
}
const props = defineProps<Props>()

const workflowRuntime = useWorkflowRuntime(() => props.workflowId)

const placeholder = '—'
const formattedRuntime = computed<string>(() => {
  const runtime = workflowRuntime.runtimeInSeconds.value
  if (runtime === null) return placeholder

  const secondsInMinute = 60
  const secondsInHour = 60 * secondsInMinute
  const secondsInDay = 24 * secondsInHour

  let factor: number
  let unit: string
  if (runtime > secondsInDay) {
    factor = 1 / secondsInDay
    unit = 'days'
  } else if (runtime > secondsInHour) {
    factor = 1 / secondsInHour
    unit = 'hours'
  } else if (runtime > secondsInMinute) {
    factor = 1 / secondsInMinute
    unit = 'minutes'
  } else {
    factor = 1
    unit = 'seconds'
  }
  const formattedRuntime = (runtime * factor).toFixed(1)
  return `${formattedRuntime} ${unit}`
})
</script>
