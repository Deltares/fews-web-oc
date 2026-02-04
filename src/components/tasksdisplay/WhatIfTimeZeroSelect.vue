<template>
  <DateTimeTextField
    v-if="!hidden"
    v-model="timeZeroDate"
    label="Time zero"
    class="datetime-field"
  >
    <template #append-inner>
      <v-divider vertical />
      <v-btn
        variant="text"
        icon
        size="small"
        @click="setTimeZero(previousTimeZero)"
      >
        <v-icon>mdi-chevron-down</v-icon>
      </v-btn>
      <v-divider vertical />
      <v-btn
        variant="text"
        icon
        size="small"
        @click="setTimeZero(nextTimeZero)"
      >
        <v-icon>mdi-chevron-up</v-icon>
      </v-btn>
    </template>
  </DateTimeTextField>
</template>

<script setup lang="ts">
import DateTimeTextField from '@/components/general/DateTimeTextField.vue'
import { configManager } from '@/services/application-config'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import { useForecastTimes } from '@/services/useForecastTimes'
import { ref, watch } from 'vue'

interface Props {
  workflowId: string | undefined
  hidden?: boolean
}
const { workflowId, hidden = false } = defineProps<Props>()

const timeZeroDate = ref<Date>(new Date())
const timeZeroString = defineModel<string>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { selectedTimeZero, nextTimeZero, previousTimeZero, valid } =
  useForecastTimes(
    baseUrl,
    () => workflowId,
    () => convertJSDateToFewsPiParameter(timeZeroDate.value),
  )

watch([selectedTimeZero, valid], ([newTimeZeroString, newValid]) => {
  // Only update the input t0 when the input is not valid
  if (!newValid) setTimeZero(newTimeZeroString)
})

function setTimeZero(date: string | undefined): void {
  if (!date) return
  timeZeroDate.value = new Date(date)
}

watch(selectedTimeZero, (newTimeZero) => {
  timeZeroString.value = newTimeZero
})
</script>
