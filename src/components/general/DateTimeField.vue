<template>
  <v-row>
    <v-col>
      <v-date-input
        prepend-icon=""
        v-model="internalDate"
        :label="dateLabel"
        variant="outlined"
        density="compact"
      />
    </v-col>
    <v-col>
      <v-text-field
        v-model="timeString"
        type="time"
        variant="outlined"
        density="compact"
        :label="timeLabel"
        cleatable
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VDateInput } from 'vuetify/labs/components'

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
</script>

<style>
/* Hide the clock icon in Chrome, Edge, and other WebKit-based browsers */
input[type='time']::-webkit-inner-spin-button,
input[type='time']::-webkit-calendar-picker-indicator {
  display: none;
  -webkit-appearance: none;
}

input[type='time']::-moz-selection {
  background-color: tomato;
}
</style>
