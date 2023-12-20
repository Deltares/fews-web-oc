<template>
  <input
    ref="inputRef"
    v-if="enabled"
    v-model.number="inputValue"
    @keydown.enter.stop="acceptEdit"
    @keydown.escape.stop="disableEdit"
    @blur="acceptEdit"
    class="legend-input"
    :style="{ top: offsetTop, left: offsetLeft }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ref, watch, nextTick, defineProps, defineEmits } from 'vue'

interface LegendInputProps {
  parentId?: string
  value?: number
  minValue?: number
  maxValue?: number
  isEditing?: boolean
}

const emit = defineEmits(['update:value', 'update:isEditing'])

const props = withDefaults(defineProps<LegendInputProps>(), {
  parentId: '',
  value: 0,
  minValue: -999999999,
  maxValue: 999999999,
  isEditing: true,
})
const inputValue = ref<number>(0)
const enabled = ref<boolean>(true)
const inputRef = ref<HTMLInputElement | null>(null)

const disableEdit = () => {
//   enabled.value = false
  emit('update:isEditing', enabled.value)
}

const acceptEdit = () => {
  if (inputValue.value > props.minValue && inputValue.value < props.maxValue) {
    emit('update:value', inputValue.value)
  }

  disableEdit()
}

const getParentBoundingClientRect = (parentId: string | null) => {
  if (parentId == null) return { top: '0px', left: '0px' }

  const parent = document.getElementById(parentId)
  if (parent == null) return { top: '0px', left: '0px' }

  const rect = parent.getBoundingClientRect()
  console.log('rect :>> ', rect);
  return { top: `${rect.top}px`, left: `${rect.left}px` }
}

const offsetTop = computed(
  () => getParentBoundingClientRect(props.parentId).top,
)

const offsetLeft = computed(
  () => {
    const left = getParentBoundingClientRect(props.parentId).left
    console.log('left :>> ', left);
    return left
  }
)

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
  width: 40px;
  height: 40px;
  position: fixed;   
  font-size: 12px;
  padding: 0;
  border-radius: 5px;
}

.legend-input input {
  padding: 8px;
}
</style>
