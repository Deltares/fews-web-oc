<template>
  <v-text-field
    v-model="dateString"
    type="datetime-local"
    :min="minString"
    :max="maxString"
    :label="label"
    density="compact"
    variant="outlined"
    class="datetime-field"
    :messages="messages"
    :error-messages="errorMessages"
    :hide-details="hideDetails"
    @change="updateModelValue()"
  >
    <template v-for="(_, slot) of slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import {
  fromDisplayDateTimeInputValue,
  getDisplayTimeZone,
  toDisplayDateTimeInputValue,
} from '@/lib/date/timeZone'

interface Props {
  label: string
  messages?: string[]
  errorMessages?: string[]
  min?: Date
  max?: Date
}

const props = defineProps<Props>()

// tsc doesnt understand useSlots type
const slots = useSlots() as Record<string, () => void>

const modelValue = defineModel<Date>({ required: true })

const dateString = ref(toDisplayDateTimeInputValue(modelValue.value))
const minString = computed<string | undefined>(() =>
  props.min ? toDisplayDateTimeInputValue(props.min) : undefined,
)
const maxString = computed<string | undefined>(() =>
  props.max ? toDisplayDateTimeInputValue(props.max) : undefined,
)
const hideDetails = computed<boolean>(() => {
  const hasMessages = props.messages !== undefined && props.messages.length > 0
  const hasErrorMessages =
    props.errorMessages !== undefined && props.errorMessages.length > 0
  return !hasMessages && !hasErrorMessages
})

watch(
  [modelValue, getDisplayTimeZone],
  ([newValue]) => {
    dateString.value = toDisplayDateTimeInputValue(newValue)
  },
  { immediate: true },
)

function updateModelValue() {
  modelValue.value = fromDisplayDateTimeInputValue(dateString.value)
}
</script>

<style scoped>
.datetime-field :deep(.v-field) {
  padding-right: 0;
}
</style>
