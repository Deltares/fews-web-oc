<template>
  <v-text-field
    v-model="dateString"
    type="datetime-local"
    :label="label"
    density="compact"
    variant="outlined"
    class="datetime-field"
    hide-details
    @change="updateModelValue()"
  >
    <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  label: string
}

defineProps<Props>()

const modelValue = defineModel<Date>({ required: true })

const dateString = ref(toLocalDateString(modelValue.value))

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
