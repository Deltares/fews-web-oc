<template>
  <div class="d-flex flex-row gc-2">
    <v-date-input v-model="internalDate" :label="dateLabel" />
    <v-menu :close-on-content-click="false">
      <template #activator="{ props }">
        <v-text-field v-bind="props" v-model="timeString" :label="timeLabel" />
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
import { computed, ref, watch } from 'vue'

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

const timeString = ref('')
// Update time string when the time was set from the picker.
watch(
  date,
  () => {
    const hours = date.value.getHours()
    const minutes = date.value.getMinutes()

    const hoursString = hours.toString().padStart(2, '0')
    const minutesString = minutes.toString().padStart(2, '0')
    timeString.value = `${hoursString}:${minutesString}`
  },
  { immediate: true },
)
// Update the date when a valid date is entered in the text field.
watch(timeString, (newTimeString) => {
  const tokens = newTimeString.split(':').map((token) => token.trim())

  // To prevent confusing interactions, only allow times with the format HH:MM,
  // so not HH:M without leading 0.
  const isValid =
    tokens.length === 2 &&
    tokens.every((token) => token.length === 2 && !isNaN(parseFloat(token)))
  if (!isValid) return

  // We are now a time string as accepted by v-time-picker, so use that setter
  // to update the date.
  const [hours, minutes] = tokens
  timeString.value = `${hours}:${minutes}`
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
