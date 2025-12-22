<template>
  <v-text-field
    ref="inputRef"
    v-if="enabled"
    v-model.number="inputValue"
    @keydown.enter.stop="acceptEdit"
    @keydown.escape.stop="disableEdit"
    @blur="acceptEdit"
    variant="solo"
    density="compact"
    single-line
    hide-details
    class="legend-input"
    :style="{ left: offsetLeft }"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

interface LegendInputProps {
  parentId: string
  value: number
  minValue?: number
  maxValue?: number
  isEditing?: boolean
}

const emit = defineEmits(['update:value', 'update:isEditing'])

const props = withDefaults(defineProps<LegendInputProps>(), {
  minValue: -999999999,
  maxValue: 999999999,
  isEditing: false,
})
const inputValue = ref<number>(0)
const enabled = ref<boolean>(false)
const inputRef = ref<HTMLInputElement>()

const disableEdit = () => {
  emit('update:isEditing', false)
}

const acceptEdit = () => {
  if (inputValue.value > props.minValue && inputValue.value < props.maxValue) {
    emit('update:value', inputValue.value)
  }

  disableEdit()
}

const offsetLeft = computed(() => {
  const parent = document.getElementById(props.parentId)
  const offset = parent?.getAttribute('transform')?.split(',')[0].split('(')[1]
  const left = +(offset ?? 0)
  return left + 'px'
})

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
    if (!inputRef.value) return
    inputRef.value.focus()
  })
}
</script>

<style scoped>
.legend-input {
  width: 40px;
  position: absolute;
  bottom: -6px;
  font-size: 12px;
  padding: 0;
  border-radius: 5px;
  transform: translateY(-10px);
}

:deep(input) {
  transform: translateY(-5px);
  text-align: center;
  padding: 0;
  margin: 0;
}

:deep(.v-input__control) {
  height: 30px;
}

.legend-input input {
  padding: 8px;
}
</style>
