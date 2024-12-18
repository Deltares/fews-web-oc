<template>
  <div class="d-flex flex-row gc-2">
    <v-date-input v-model="internalDate" :label="dateLabel" />
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
        hide-header
      />
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { VDateInput } from 'vuetify/labs/components'
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

<style scoped>
/* HACK: hide prepend icon, which cannot be disabled from the API. */
:deep(.v-input__prepend) {
  display: none;
}
</style>
