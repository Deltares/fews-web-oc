<template>
  <DateTimeTextField
    v-model="date"
    :label="label"
    :messages="messages"
    :error-messages="errorMessages"
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

import {
  computeValidDateRange,
  DateValidationOptions,
  ExtendedJsonSchema7,
  formatTimeStep,
  matchesCardinalTimeStep,
} from '@/lib/whatif'

import DateTimeTextField from '@/components/general/DateTimeTextField.vue'

const props = withDefaults(defineProps<ControlProps>(), {
  ...rendererProps<ControlElement>(),
})
const control = useJsonFormsControl(props)

const label = computed<string>(() => control.control.value.label)
const errorMessages = computed<string[] | undefined>(() => {
  const message = control.control.value.errors
  return message === '' ? [] : message.split('\n')
})
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

const referenceTime = inject<Ref<Date>>('whatIfReferenceTime')
const validDateRange = computed<[Date, Date] | null>(() => {
  const options = dateValidation.value?.relativeViewPeriod
  if (!options) return null
  return computeValidDateRange(referenceTime?.value ?? new Date(), options)
})

const messages = computed<string[]>(() => {
  return [...createTimeStepMessages(), ...createDateRangeMessages()]
})

const date = ref<Date>(constrainDate(getDateFromPropertyOrDefault()))
watch(
  date,
  (newDate) => {
    if (isNaN(newDate.getTime())) return
    control.handleChange(control.control.value.path, newDate.toISOString())
  },
  // Immediately set the possibly constrained initial value to the property.
  { immediate: true },
)
watch(propertyValue, () => {
  const updated = getDateFromPropertyOrDefault()
  // Prevent reactivity loop by only updating if our value changed.
  if (updated.getTime() == date.value.getTime()) return
  date.value = updated
})

function getDateFromPropertyOrDefault(): Date {
  const dateString: string | undefined =
    propertyValue.value ?? control.control.value.schema.default
  if (dateString === undefined) return new Date()
  const parsed = new Date(dateString)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

function constrainDate(date: Date): Date {
  // If a cardinal time step was specified, align the date/time to it.
  const aligned =
    cardinalTimeStepHours.value !== null
      ? alignToTimeStep(date, cardinalTimeStepHours.value)
      : date
  // If a date range was specified, make sure the value does not exceed it, and
  // keep it aligned with the time step.
  const limited = validDateRange.value
    ? limitToAlignedRelativeViewPeriod(aligned, validDateRange.value)
    : aligned
  return limited
}

function alignToTimeStep(
  date: Date,
  timeStepHours: number,
  mode: 'round' | 'floor' | 'ceil' = 'round',
): Date {
  const timestamp = date.getTime()
  const timeStepMilliseconds = timeStepHours * 60 * 60 * 1000
  const roundFunc =
    mode === 'round' ? Math.round : mode === 'floor' ? Math.floor : Math.ceil
  const roundedTimestamp =
    roundFunc(timestamp / timeStepMilliseconds) * timeStepMilliseconds
  const rounded = new Date(roundedTimestamp)
  return rounded.getTime() === date.getTime() ? date : rounded
}

function limitToAlignedRelativeViewPeriod(
  date: Date,
  validDateRange: [Date, Date],
): Date {
  const [startDate, endDate] = validDateRange
  if (date < startDate) {
    return cardinalTimeStepHours.value === null
      ? startDate
      : alignToTimeStep(startDate, cardinalTimeStepHours.value, 'ceil')
  }
  if (date > endDate) {
    return cardinalTimeStepHours.value === null
      ? endDate
      : alignToTimeStep(endDate, cardinalTimeStepHours.value, 'floor')
  }
  return date
}

function createTimeStepMessages(): string[] {
  const timeStepHours = cardinalTimeStepHours.value
  if (!timeStepHours) return []
  return [`Time step: ${formatTimeStep(timeStepHours)}`]
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
  // If we are outside a specified date range, make sure we go to the nearest
  // valid date.
  if (validDateRange.value) {
    const [startDate, endDate] = validDateRange.value
    if (date.value < startDate || date.value > endDate) {
      return constrainDate(date.value)
    }
  }
  // If we do not match the cardinal time step, we should go to the
  // previous/next valid time step.
  if (
    cardinalTimeStepHours.value &&
    !matchesCardinalTimeStep(date.value, cardinalTimeStepHours.value)
  ) {
    const roundMode = isNext ? 'ceil' : 'floor'
    return constrainDate(
      alignToTimeStep(date.value, cardinalTimeStepHours.value, roundMode),
    )
  }

  // Otherwise, increase or decrease the date with the specified time step.
  const offsetHours = isNext ? timeStepHours : -timeStepHours
  const next = new Date(date.value.getTime() + offsetHours * 60 * 60 * 1000)
  return constrainDate(next)
}

function canStepTime(isNext: boolean): boolean {
  if (validDateRange.value !== null) {
    const [startDate, endDate] = validDateRange.value
    if (date.value < startDate) return isNext
    if (date.value > endDate) return !isNext
  }
  return stepTime(isNext).getTime() !== date.value.getTime()
}
</script>
