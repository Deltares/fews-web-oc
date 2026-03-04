<template>
  <DateTimeTextField v-model="constrainedDate" :label="label" />
</template>

<script setup lang="ts">
import DateTimeTextField from '@/components/general/DateTimeTextField.vue'
import {
  CardinalTimeStepOptions,
  DateValidationOptions,
  ExtendedJsonSchema7,
} from '@/lib/whatif'
import { ControlElement } from '@jsonforms/core'
import {
  ControlProps,
  rendererProps,
  useJsonFormsControl,
} from '@jsonforms/vue'

import { computed, ref, watch } from 'vue'

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
  const aligned = dateValidation.value?.cardinalTimeStep
    ? alignToCardinalTimeStep(date, dateValidation.value?.cardinalTimeStep)
    : date
  return aligned
}

function alignToCardinalTimeStep(
  date: Date,
  options: CardinalTimeStepOptions,
): Date {
  const timestamp = date.getTime()
  const timeStepMilliseconds = options.timeStepHours * 60 * 60 * 1000
  const roundedTimestamp =
    Math.round(timestamp / timeStepMilliseconds) * timeStepMilliseconds
  const rounded = new Date(roundedTimestamp)
  return rounded.getTime() === date.getTime() ? date : rounded
}
</script>
