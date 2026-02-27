<template>
  <DateTimeTextField v-model="date" :label="label" />
</template>

<script setup lang="ts">
import DateTimeTextField from '@/components/general/DateTimeTextField.vue'
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

const date = ref<Date>(getDefaultDate())

// Update control and form data for changes in either.
watch(
  propertyValue,
  (newValue) => {
    if (newValue === undefined || newValue === date.value.toISOString()) return
    date.value = new Date(newValue)
  },
  { immediate: true },
)
watch(date, (newDate) =>
  control.handleChange(control.control.value.path, newDate.toISOString()),
)

function getDefaultDate(): Date {
  const defaultString = control.control.value.schema.default
  if (!defaultString) return new Date()
  return new Date(defaultString)
}
</script>
