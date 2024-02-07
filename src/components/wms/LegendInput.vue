<template>
  <input
    ref="inputRef"
    v-if="enabled"
    v-model.number="inputValue"
    @keydown.enter.stop="acceptEdit"
    @keydown.escape.stop="disableEdit"
    @blur="acceptEdit"
    class="legend-input"
    :style="{ left: offset }"
  />
</template>

<script setup lang="ts">
import { ref, watch, nextTick, defineProps, defineEmits } from 'vue'

interface LegendInputProps {
  value?: number
  minValue?: number
  maxValue?: number
  offset?: string
  isEditing?: boolean
}

const emit = defineEmits(['update:value', 'update:isEditing'])

const props = withDefaults(defineProps<LegendInputProps>(), {
  value: 0,
  minValue: -999999999,
  maxValue: 999999999,
  offset: '',
  isEditing: false,
})
const inputValue = ref<number>(0)
const enabled = ref<boolean>(false)
const inputRef = ref<HTMLInputElement | null>(null)

const disableEdit = () => {
  enabled.value = false
  emit('update:isEditing', enabled.value)
}

const acceptEdit = () => {
  if (inputValue.value > props.minValue && inputValue.value < props.maxValue) {
    emit('update:value', inputValue.value)
  }

  disableEdit()
}

watch(
  () => props.isEditing,
  (newValue) => {
    enabled.value = newValue

    if (enabled.value) {
      inputValue.value = props.value
      focusInput()
    }
  },
)

const focusInput = () => {
  nextTick(() => {
    if (inputRef.value == null) return
    inputRef.value.focus()
  })
}
</script>

<style scoped>
.legend-input {
  font-size: 12px;
  padding: 0;
  border-radius: 5px;
}

.legend-input input {
  padding: 8px;
}
</style>
