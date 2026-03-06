<template>
  <DateTimeTextField
    v-model="constrainedDate"
    :label="label"
    :messages="messages"
  >
    <template #append-inner v-if="cardinalTimeStepHours !== null">
      <v-divider vertical />
      <v-btn
        variant="text"
        icon
        size="small"
        @click="date = stepTime(false)"
        :disabled="!canStepTime(false)"
      >
        <v-icon>mdi-chevron-down</v-icon>
      </v-btn>
      <v-divider vertical />
      <v-btn
        variant="text"
        icon
        size="small"
        @click="date = stepTime(true)"
        :disabled="!canStepTime(true)"
      >
        <v-icon>mdi-chevron-up</v-icon>
      </v-btn>
    </template>
  </DateTimeTextField>
</template>

<script setup lang="ts">
import { ControlElement } from '@jsonforms/core'
import {
  ControlProps,
  rendererProps,
  useJsonFormsControl,
} from '@jsonforms/vue'
import { computed, inject, type Ref, ref, watch } from 'vue'

import { DateValidationOptions, ExtendedJsonSchema7 } from '@/lib/whatif'

import DateTimeTextField from '@/components/general/DateTimeTextField.vue'

const props = withDefaults(defineProps<ControlProps>(), {
  ...rendererProps<ControlElement>(),
})
const control = useJsonFormsControl(props)

const label = computed<string>(() => control.control.value.label)
const propertyValue = computed<string | undefined>(
  () => control.control.value.data,
)
const dateValidation = computed<DateValidationOptions | null>(() => {
  const schema = control.control.value.schema as ExtendedJsonSchema7
  return schema.dateValidation ?? null
})

const cardinalTimeStepHours = computed<number | null>(
  () => dateValidation.value?.cardinalTimeStep?.timeStepHours ?? null,
)

const timeZero = inject<Ref<string | undefined>>('whatIfTimeZero')
// Reference time used to set relative period limits.
const referenceTime = computed<Date>(() => {
  if (timeZero?.value === undefined) return new Date()
  const parsed = new Date(timeZero.value)
  return isNaN(parsed.getTime()) ? new Date() : parsed
})
const validDateRange = computed<[Date, Date] | null>(() => {
  const options = dateValidation.value?.relativeViewPeriod
  if (!options) return null

  const dateFromOffset = (offsetHours: number) =>
    new Date(referenceTime.value.getTime() + offsetHours * 60 * 60 * 1000)
  return [
    dateFromOffset(options.startOffsetHours),
    dateFromOffset(options.endOffsetHours),
  ]
})

const messages = computed<string[]>(() => {
  return [...createTimeStepMessages(), ...createDateRangeMessages()]
})

const date = ref<Date>(getDateFromProperty())

const constrainedDate = computed<Date>({
  get: () => constrainDate(date.value),
  set: (value: Date) => {
    date.value = constrainDate(value)
    // Prevent reactivity loop by only writing when the date has changed.
    const newProperty = date.value.toISOString()
    if (propertyValue.value === newProperty) return
    control.handleChange(control.control.value.path, newProperty)
  },
})
watch(
  propertyValue,
  () => {
    const updated = getDateFromProperty()
    if (updated == date.value) return
    date.value = updated
  },
  { immediate: true },
)

function getDateFromProperty(): Date {
  return constrainDate(
    propertyValue.value ? new Date(propertyValue.value) : getDefaultDate(),
  )
}

function getDefaultDate(): Date {
  const defaultString = control.control.value.schema.default
  if (!defaultString) return new Date()
  return new Date(defaultString)
}

function constrainDate(date: Date): Date {
  // If a cardinal time step was specified, align the date/time to it.
  const aligned =
    cardinalTimeStepHours.value !== null
      ? alignToTimeStep(date, cardinalTimeStepHours.value)
      : date
  const limited = validDateRange.value
    ? limitToRelativeViewPeriod(aligned, validDateRange.value)
    : aligned
  return limited
}

function alignToTimeStep(date: Date, timeStepHours: number): Date {
  const timestamp = date.getTime()
  const timeStepMilliseconds = timeStepHours * 60 * 60 * 1000
  const roundedTimestamp =
    Math.round(timestamp / timeStepMilliseconds) * timeStepMilliseconds
  const rounded = new Date(roundedTimestamp)
  return rounded.getTime() === date.getTime() ? date : rounded
}

function limitToRelativeViewPeriod(
  date: Date,
  validDateRange: [Date, Date],
): Date {
  const [startDate, endDate] = validDateRange
  if (date < startDate) return startDate
  if (date > endDate) return endDate
  return date
}

function createTimeStepMessages(): string[] {
  const timeStepHours = cardinalTimeStepHours.value
  if (!timeStepHours) return []

  const useMinutes = timeStepHours < 1
  const unit = useMinutes ? 'minute' : 'hour'
  const multiplier = useMinutes ? timeStepHours * 60 : timeStepHours

  if (multiplier === 1) return [`1 ${unit}`]
  return [`Time step: ${multiplier} ${unit}s`]
}

function createDateRangeMessages(): string[] {
  if (validDateRange.value === null) return []
  const [startDate, endDate] = validDateRange.value
  return [
    `Earliest valid time: ${startDate.toLocaleString()}`,
    `Latest valid time: ${endDate.toLocaleString()}`,
  ]
}

function stepTime(isNext: boolean): Date {
  const timeStepHours = cardinalTimeStepHours.value
  if (timeStepHours === null) return date.value

  const offsetHours = isNext ? timeStepHours : -timeStepHours
  const next = new Date(date.value.getTime() + offsetHours * 60 * 60 * 1000)
  return constrainDate(next)
}

function canStepTime(isNext: boolean): boolean {
  return stepTime(isNext).getTime() !== date.value.getTime()
}
</script>
