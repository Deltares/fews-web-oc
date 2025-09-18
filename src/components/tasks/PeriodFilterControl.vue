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
          <span>{{ getTitle(selectedOption[0]) }}</span>
          <v-spacer />
          <v-icon>{{
            isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'
          }}</v-icon>
        </template>
      </v-chip>
    </template>
    <v-list
      v-model:selected="selectedOption"
      density="compact"
      mandatory
      select-strategy="single-leaf"
    >
      <v-list-item
        v-for="option in options"
        :key="option.id"
        :title="option.title"
        :value="option.numSecondsBack"
      >
        <template v-slot:prepend="{ isSelected, select }">
          <v-list-item-action start tabindex="-1">
            <v-checkbox-btn
              :model-value="isSelected"
              @update:model-value="select"
              true-icon="mdi-circle-small"
              false-icon=""
              indeterminate-icon=""
              density="compact"
              tabindex="-1"
            ></v-checkbox-btn>
          </v-list-item-action>
        </template>
      </v-list-item>
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
  numSecondsBack: number | 'All'
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
    numSecondsBack: 'All',
  },
] as const

const selectedOption = ref<[number | 'All']>(['All'])

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
  numSecondsBack.value =
    selectedOption.value[0] === 'All' ? null : selectedOption.value[0]
})

function getTitle(numSecondsBack: number | 'All'): string {
  const option = options.find((opt) => opt.numSecondsBack === numSecondsBack)
  return option ? option.title : 'Unknown'
}
</script>

<style scoped>
.period-filter-chip {
  width: 150px;
}

.period-filter-chip :deep(.v-chip__content) {
  width: 100%;
}
</style>
