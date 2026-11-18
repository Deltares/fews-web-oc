<template>
  <period-range-grid
    v-if="unit !== 'day'"
    :unit="unit"
    :first="modelValue[0]"
    :last="modelValue.at(-1)"
    :anchor="anchor"
    :now="now"
    @select="onGridSelect"
  />
  <v-date-picker
    v-else
    :model-value="modelValue"
    @update:model-value="onPickerUpdate"
    v-model:month="month"
    v-model:year="year"
    multiple="range"
    hide-header
    show-adjacent-months
    weeks-in-month="dynamic"
    control-height="32"
    width="100%"
    class="compact-date-picker"
    :aria-label="ariaLabel"
    @keydown="onDayKeydown"
  >
    <!-- Without the month and year views, like the period grid -->
    <template #controls="{ monthYearText, prevMonth, nextMonth }">
      <div class="compact-date-picker__controls">
        <v-btn
          icon="mdi-chevron-left"
          size="small"
          :aria-label="t('timeControl.previousPage')"
          @click="prevMonth"
        />
        <span class="text-body-2">{{ monthYearText }}</span>
        <v-btn
          icon="mdi-chevron-right"
          size="small"
          :aria-label="t('timeControl.nextPage')"
          @click="nextMonth"
        />
      </div>
    </template>
    <!-- Mark today of the given current date, not of the browser -->
    <template #day="{ props: dayProps, item }">
      <v-btn
        v-bind="dayProps"
        :variant="getDayVariant(dayProps, item.date)"
        :aria-current="isToday(item.date) ? 'date' : undefined"
      >
        {{ item.localized }}
      </v-btn>
    </template>
  </v-date-picker>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PeriodRangeGrid from './PeriodRangeGrid.vue'

interface Props {
  /** The first and last day of the selected period, as wall-clock dates. */
  modelValue: Date[]
  /** The unit to pick the period in. */
  unit: 'day' | 'month' | 'year'
  /** The date whose month or page is shown, e.g. the end of a preset period. */
  anchor?: Date
  /** The current date, as wall-clock date. */
  now?: Date
  ariaLabel?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** The first and last day of the picked period, as wall-clock dates. */
  'update:modelValue': [days: Date[]]
}>()

const { t } = useI18n()

// Month shown in the day calendar, only moved when the anchor is in another
// month, so a moving preset does not reset browsing
const initialMonth =
  props.anchor ?? props.modelValue.at(-1) ?? props.now ?? new Date()
const month = ref(initialMonth.getMonth())
const year = ref(initialMonth.getFullYear())

watch(
  () => {
    const anchor = props.anchor
    return anchor ? anchor.getFullYear() * 12 + anchor.getMonth() : undefined
  },
  (monthIndex) => {
    if (monthIndex === undefined) return
    year.value = Math.floor(monthIndex / 12)
    month.value = monthIndex % 12
  },
)

const today = computed(() => {
  const now = props.now ?? new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
})

function isToday(date: Date): boolean {
  return date.getTime() === today.value.getTime()
}

// The day props of Vuetify have the variant, though it is not in their type
function getDayVariant(dayProps: object, date: Date) {
  // Selected days are flat, other days are outlined for today only
  if ('variant' in dayProps && dayProps.variant === 'flat') return 'flat'
  return isToday(date) ? 'outlined' : 'text'
}

// Page Up and Down move a month, with Shift a year, like the period grid. The
// arrow keys, Enter and Escape are handled by the date picker.
async function onDayKeydown(event: KeyboardEvent) {
  if (event.key !== 'PageUp' && event.key !== 'PageDown') return
  const isoDate = (event.target as HTMLElement).dataset.vDate
  if (!isoDate) return
  event.preventDefault()
  const [y, m, d] = isoDate.split('-').map(Number)
  const months = (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1)
  const firstOfMonth = new Date(y, m - 1 + months, 1)
  const lastDay = new Date(
    firstOfMonth.getFullYear(),
    firstOfMonth.getMonth() + 1,
    0,
  ).getDate()
  const target = new Date(
    firstOfMonth.getFullYear(),
    firstOfMonth.getMonth(),
    Math.min(d, lastDay),
  )
  const picker = event.currentTarget as HTMLElement
  month.value = target.getMonth()
  year.value = target.getFullYear()
  await nextTick()
  picker
    .querySelector<HTMLElement>(`[data-v-date="${toIsoDate(target)}"]`)
    ?.focus()
}

function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function onGridSelect(firstDay: Date, lastDay: Date) {
  emit('update:modelValue', [firstDay, lastDay])
}

function onPickerUpdate(days: unknown) {
  // Picking the first day again clears the selection, keep that day instead
  if (!Array.isArray(days) || days.length === 0) return
  emit('update:modelValue', days)
}
</script>

<style scoped>
.compact-date-picker__controls {
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: space-between;
}

.compact-date-picker :deep(.v-date-picker-month) {
  padding-bottom: 4px;
}

.compact-date-picker :deep(.v-date-picker-month__day) {
  height: 28px;
  padding: 1px;
}

.compact-date-picker :deep(.v-date-picker-month__weekday) {
  height: 20px;
}

.compact-date-picker :deep(.v-date-picker-month__day .v-btn) {
  --v-btn-height: 20px;
  width: 26px;
  height: 26px;
}
</style>
