<template>
  <v-list-item prepend-icon="mdi-timer" density="compact">
    Expected runtime: {{ formattedRuntime }}
  </v-list-item>
</template>
<script setup lang="ts">
import { WorkflowItem } from '@/lib/workflows'
import { computed } from 'vue'

interface Props {
  workflow: WorkflowItem | undefined
}
const props = defineProps<Props>()

const placeholder = '—'
const formattedRuntime = computed<string>(() => {
  const runtime = props.workflow?.expectedRuntimeSeconds ?? null
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
  const formattedRunTimeString = (runtime * factor).toFixed(1)
  return `${formattedRunTimeString} ${unit}`
})
</script>
