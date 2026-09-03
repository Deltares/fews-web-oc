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
        v-for="option in activeOptions"
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
import { Duration, DurationLikeObject } from 'luxon'
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  type?: 'onlyLong' | 'onlyShort'
}

const { type } = defineProps<Props>()

const period = defineModel<RelativePeriod | null>({ required: true })

const { locale, t } = useI18n()

interface RelativePeriodOption {
  id: string
  title?: string
  duration: DurationLikeObject | null
  numSecondsBack: number | null
}

const rawOptions = [
  { id: '-2h', duration: { hours: 2 } },
  { id: '-8h', duration: { hours: 8 } },
  { id: '-1d', duration: { days: 1 } },
  { id: '-1w', duration: { weeks: 1 } },
  { id: '-1m', duration: { months: 1 } },
  { id: '-1y', duration: { years: 1 } },
  { id: 'all', duration: null },
] as const

const options = rawOptions.map((option) => ({
  ...option,
  numSecondsBack: getSecondsBack(option.duration),
  title: formatDurationTitle(option.duration),
}))

function getSecondsBack(duration: DurationLikeObject | null): number | null {
  if (duration === null) return null
  return Duration.fromObject(duration).as('seconds')
}

function formatDurationTitle(duration: DurationLikeObject | null): string {
  if (duration === null) return t('periodFilter.all')
  // Without 1's
  const human = Duration.fromObject(duration, { locale: locale.value })
    .toHuman()
    .replace(/1 /g, '')
  return t('periodFilter.last', { duration: human })
}

const weekInSeconds = Duration.fromObject({ weeks: 1 }).as('seconds')
const activeOptions = computed(() => {
  if (type === 'onlyLong') {
    return options.filter(
      (option) =>
        option.numSecondsBack === null ||
        option.numSecondsBack >= weekInSeconds,
    )
  }
  if (type === 'onlyShort') {
    return options.filter(
      (option) =>
        option.numSecondsBack !== null &&
        option.numSecondsBack <= weekInSeconds,
    )
  }
  return options
})

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
