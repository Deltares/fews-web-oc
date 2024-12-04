<template>
  <div class="d-flex flex-row gc-2">
    <v-menu :close-on-content-click="false">
      <template #activator="{ props }">
        <v-text-field
          v-bind="props"
          :model-value="dateString"
          :label="dateLabel"
          readonly
        />
      </template>
      <v-date-picker v-model="internalDate" />
    </v-menu>
    <v-menu :close-on-content-click="false">
      <template #activator="{ props }">
        <v-text-field
          v-bind="props"
          :model-value="timeString"
          :label="timeLabel"
          readonly
        />
      </template>
      <v-time-picker
        v-model="internalTime"
        format="24hr"
        :use-seconds="false"
        @update:hour="updateHours"
        @update:minute="updateMinutes"
      />
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { VTimePicker } from 'vuetify/labs/components'

interface Props {
  dateLabel?: string
  timeLabel?: string
}
defineProps<Props>()
const date = defineModel<Date>({ required: true })

// Get/set date and time from the date/time picker components.
const internalDate = computed<Date>({
  get: () => date.value,
  set: (newValue) => {
    const newDate = new Date(date.value)
    newDate.setFullYear(newValue.getFullYear())
    newDate.setMonth(newValue.getMonth())
    newDate.setDate(newValue.getDate())
    date.value = newDate
  },
})
const internalTime = computed<string>({
  get: () => timeString.value,
  set: (newValue) => {
    const [hours, minutes] = newValue.split(':').map(parseFloat)

    const newDate = new Date(date.value)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    date.value = newDate
  },
})

// Get date and time from the text fields.
const dateString = computed<string>(() => {
  const year = date.value.getFullYear()
  const month = date.value.getMonth()
  const day = date.value.getDate()

  const monthString = (month + 1).toString().padStart(2, '0')
  const dayString = day.toString().padStart(2, '0')
  return `${year}-${monthString}-${dayString}`
})

const timeString = computed<string>(() => {
  const hours = date.value.getHours()
  const minutes = date.value.getMinutes()

  const hoursString = hours.toString().padStart(2, '0')
  const minutesString = minutes.toString().padStart(2, '0')
  return `${hoursString}:${minutesString}`
})

function updateHours(hours: number): void {
  const newDate = new Date(date.value)
  newDate.setHours(hours)
  date.value = newDate
}

function updateMinutes(minutes: number): void {
  const newDate = new Date(date.value)
  newDate.setMinutes(minutes)
  date.value = newDate
}
</script>
