<template>
  <v-select
    v-model="numSecondsBack"
    :items="options"
    item-value="numSecondsBack"
    density="compact"
    variant="plain"
    flat
    hide-details
  />
</template>
<script setup lang="ts">
import { RelativePeriod } from '@/lib/period'
import { computed } from 'vue'

const period = defineModel<RelativePeriod | null>({ required: true })

interface RelativePeriodOption {
  id: string
  title: string
  numSecondsBack: number | null
}

const secondsPerHour = 60 * 60
const secondsPerDay = 24 * secondsPerHour
const options: RelativePeriodOption[] = [
  {
    id: '-2h',
    title: 'Last 2 hours',
    numSecondsBack: 2 * secondsPerHour,
  },
  {
    id: '-8h',
    title: 'Last 8 hours',
    numSecondsBack: 8 * secondsPerHour,
  },
  {
    id: '-1d',
    title: 'Last day',
    numSecondsBack: 1 * secondsPerDay,
  },
  {
    id: '-1w',
    title: 'Last week',
    numSecondsBack: 7 * secondsPerDay,
  },
  {
    id: 'all',
    title: 'All',
    numSecondsBack: null,
  },
] as const

const numSecondsBack = computed<number | null>({
  get: () => {
    if (!period.value) return null
    return -period.value?.startOffsetSeconds
  },
  set: (newNumSecondsBack) => {
    if (newNumSecondsBack === null) {
      period.value = null
    } else {
      period.value = {
        startOffsetSeconds: -newNumSecondsBack,
        endOffsetSeconds: 0,
      }
    }
  },
})
</script>
