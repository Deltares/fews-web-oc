<template>
  <div class="date-separator__container">
    <div class="date-separator__line"></div>
    <div class="date-separator__text">{{ formattedDate }}</div>
    <div class="date-separator__line"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon'
import { toDisplayDateTime } from '@/lib/date/timeZone'

interface Props {
  /** A day in the display time zone, as yyyy-MM-dd. */
  date: string
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  const today = toDisplayDateTime(Date.now())

  if (props.date === today.toISODate()) {
    return 'Today'
  }

  if (props.date === today.minus({ days: 1 }).toISODate()) {
    return 'Yesterday'
  }

  // For other dates, return a formatted date
  return DateTime.fromISO(props.date, { zone: 'UTC' }).toLocaleString(
    { day: '2-digit', month: 'short', year: 'numeric' },
    { locale: 'en-GB' },
  )
})
</script>

<style scoped>
.date-separator__container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
  gap: 12px;
  width: 100%;
}

.date-separator__text {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  padding: 0 8px;
  white-space: nowrap;
}

.date-separator__line {
  flex: 1;
  height: 1px;
  background-color: rgba(var(--v-theme-on-surface), 0.1);
}
</style>
