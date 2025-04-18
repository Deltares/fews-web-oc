<template>
  <v-menu>
    <template #activator="{ props, isActive }">
      <v-chip
        variant="tonal"
        pilled
        label
        v-bind="props"
        class="me-2 px-2 period-filter-chip"
      >
        <template #default>
          <span>{{ selectedOption?.title }}</span>
          <v-spacer />
          <v-icon>{{
            isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'
          }}</v-icon>
        </template>
      </v-chip>
    </template>
    <v-list density="compact">
      <v-list-item
        v-for="option in options"
        :key="option.id"
        :title="option.title"
        :active="selectedOption?.id === option.id"
        @click="numSecondsBack = option.numSecondsBack"
      />
    </v-list>
  </v-menu>
</template>
<script setup lang="ts">
import { RelativePeriod } from '@/lib/period'
import { computed, ref, watchEffect } from 'vue'

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

const selectedOption = ref<RelativePeriodOption>()

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

watchEffect(() => {
  selectedOption.value = options.find(
    (option) => option.numSecondsBack === numSecondsBack.value,
  )
})

watchEffect(() => {
  numSecondsBack.value = selectedOption.value?.numSecondsBack ?? null
})
</script>

<style scoped>
.period-filter-chip {
  width: 105px;
}

.period-filter-chip :deep(.v-chip__content) {
  width: 100%;
}
</style>
