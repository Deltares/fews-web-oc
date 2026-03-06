<template>
  <v-text-field
    v-model="dateString"
    type="datetime-local"
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

interface Props {
  label: string
  messages?: string[]
  errorMessages?: string[]
}

const props = defineProps<Props>()

// tsc doesnt understand useSlots type
const slots = useSlots() as Record<string, () => void>

const modelValue = defineModel<Date>({ required: true })

const dateString = ref(toLocalDateString(modelValue.value))
const hideDetails = computed<boolean>(() => {
  const hasMessages = props.messages !== undefined && props.messages.length > 0
  const hasErrorMessages =
    props.errorMessages !== undefined && props.errorMessages.length > 0
  return !hasMessages && !hasErrorMessages
})

function toLocalDateString(date: Date) {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

watch(
  modelValue,
  (newValue) => {
    dateString.value = toLocalDateString(newValue)
  },
  { immediate: true },
)

function updateModelValue() {
  modelValue.value = new Date(dateString.value)
}
</script>

<style scoped>
.datetime-field :deep(.v-field) {
  padding-right: 0;
}
</style>
