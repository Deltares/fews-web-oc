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
          <SelectIcon :active="isActive" />
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
import SelectIcon from '@/components/general/SelectIcon.vue'
import type { RelativePeriod } from '@/lib/period'
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
    return -period.value.startOffsetSeconds
  },
  set: (newNumSecondsBack) => {
    if (newNumSecondsBack === null) {
      period.value = null
    } else {
      const newPeriod = {
        startOffsetSeconds: -newNumSecondsBack,
        endOffsetSeconds: 0,
      }
      if (
        period.value?.startOffsetSeconds !== newPeriod.startOffsetSeconds ||
        period.value?.endOffsetSeconds !== newPeriod.endOffsetSeconds
      ) {
        period.value = newPeriod
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
