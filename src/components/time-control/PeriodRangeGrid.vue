<template>
  <div class="period-range-grid">
    <div class="period-range-grid__controls">
      <v-btn
        icon="mdi-chevron-left"
        size="small"
        :aria-label="t('timeControl.previousPage')"
        @click="pageStart -= pageSize"
      />
      <span class="text-body-2">{{ pageLabel }}</span>
      <v-btn
        icon="mdi-chevron-right"
        size="small"
        :aria-label="t('timeControl.nextPage')"
        @click="pageStart += pageSize"
      />
    </div>
    <div
      class="period-range-grid__cells"
      @mouseleave="hoveredIndex = undefined"
    >
      <div
        v-for="cell in cells"
        :key="cell.index"
        class="period-range-grid__cell"
        :class="{
          'period-range-grid__cell--range': isInRange(cell.index),
          'period-range-grid__cell--start': isRangeStart(cell.index),
          'period-range-grid__cell--end': isRangeEnd(cell.index),
        }"
      >
        <v-btn
          :variant="
            isRangeEnd(cell.index) || isRangeStart(cell.index) ? 'flat' : 'text'
          "
          :color="
            isRangeEnd(cell.index) || isRangeStart(cell.index)
              ? 'surface-variant'
              : undefined
          "
          :class="{ 'period-range-grid__current': cell.index === currentIndex }"
          rounded
          size="small"
          :aria-pressed="isInRange(cell.index)"
          @click="onSelect(cell.index)"
          @mouseenter="hoveredIndex = cell.index"
          @focus="hoveredIndex = cell.index"
        >
          {{ cell.label }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  /** The unit of the cells. */
  unit: 'month' | 'year'
  /** The first day of the selected period, as wall-clock date. */
  first?: Date
  /** The last day of the selected period, as wall-clock date. */
  last?: Date
  /** The date whose page is shown, e.g. the end of a preset period. */
  anchor?: Date
  /** The current date, as wall-clock date. */
  now?: Date
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** The first and last day of the picked range, as wall-clock dates. */
  select: [first: Date, last: Date]
}>()

const { t, locale } = useI18n()

// Cells are indexed by year for years, and by year * 12 + month for months
const pageSize = 12

function toIndex(date: Date): number {
  return props.unit === 'month'
    ? date.getFullYear() * 12 + date.getMonth()
    : date.getFullYear()
}

function firstDayOf(index: number): Date {
  return props.unit === 'month'
    ? new Date(Math.floor(index / 12), index % 12, 1)
    : new Date(index, 0, 1)
}

function lastDayOf(index: number): Date {
  return props.unit === 'month'
    ? new Date(Math.floor(index / 12), (index % 12) + 1, 0)
    : new Date(index, 11, 31)
}

function getPageStart(date: Date): number {
  const index = toIndex(date)
  return Math.floor(index / pageSize) * pageSize
}

const currentIndex = computed(() => toIndex(props.now ?? new Date()))
function getInitialPageStart(): number {
  return getPageStart(props.anchor ?? props.first ?? props.now ?? new Date())
}

const pageStart = ref(getInitialPageStart())

// Only move when the anchor is on another page, so browsing is kept
watch(
  () => props.anchor && getPageStart(props.anchor),
  (anchorPageStart) => {
    if (anchorPageStart !== undefined) pageStart.value = anchorPageStart
  },
)

// The first picked cell, until the second one is picked
const pendingIndex = ref<number>()
const hoveredIndex = ref<number>()

watch(
  () => props.unit,
  () => {
    pendingIndex.value = undefined
    pageStart.value = getInitialPageStart()
  },
)

const range = computed<[number, number] | undefined>(() => {
  if (pendingIndex.value !== undefined) {
    const other = hoveredIndex.value ?? pendingIndex.value
    return [
      Math.min(pendingIndex.value, other),
      Math.max(pendingIndex.value, other),
    ]
  }
  if (!props.first || !props.last) return undefined
  return [toIndex(props.first), toIndex(props.last)]
})

function isInRange(index: number): boolean {
  return !!range.value && index >= range.value[0] && index <= range.value[1]
}

function isRangeStart(index: number): boolean {
  return range.value?.[0] === index
}

function isRangeEnd(index: number): boolean {
  return range.value?.[1] === index
}

const monthFormatter = computed(
  () => new Intl.DateTimeFormat(locale.value, { month: 'short' }),
)

const cells = computed(() =>
  Array.from({ length: pageSize }, (_, offset) => {
    const index = pageStart.value + offset
    const label =
      props.unit === 'month'
        ? monthFormatter.value.format(firstDayOf(index))
        : String(index)
    return { index, label }
  }),
)

const pageLabel = computed(() =>
  props.unit === 'month'
    ? String(Math.floor(pageStart.value / 12))
    : `${pageStart.value} – ${pageStart.value + pageSize - 1}`,
)

function onSelect(index: number) {
  const pending = pendingIndex.value
  if (pending === undefined) {
    // A single cell is a period of one month or year, until a second is picked
    pendingIndex.value = index
    emit('select', firstDayOf(index), lastDayOf(index))
    return
  }
  pendingIndex.value = undefined
  emit(
    'select',
    firstDayOf(Math.min(pending, index)),
    lastDayOf(Math.max(pending, index)),
  )
}
</script>

<style scoped>
/* Spacing like the compact date picker of the time control menu */
.period-range-grid {
  padding: 0 12px 4px;
}

.period-range-grid__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
}

.period-range-grid__cells {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.period-range-grid__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 28px;
  padding: 1px 0;
}

.period-range-grid__cell--range::before {
  content: '';
  position: absolute;
  inset: 1px 0;
  background: rgba(var(--v-theme-on-surface), 0.1);
}

.period-range-grid__cell--start::before {
  inset-inline-start: 8px;
  border-start-start-radius: 999px;
  border-end-start-radius: 999px;
}

.period-range-grid__cell--end::before {
  inset-inline-end: 8px;
  border-start-end-radius: 999px;
  border-end-end-radius: 999px;
}

.period-range-grid__cell .v-btn {
  min-width: 56px;
  height: 26px;
}

.period-range-grid__current {
  outline: thin solid currentColor;
}
</style>
