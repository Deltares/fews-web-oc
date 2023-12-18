<template>
  <vue-slider
    class="elevation-slider"
    :model-value="currentValue"
    :max="maxValue"
    :min="minValue"
    :marks="marks"
    :interval="interval"
    :keydownHook="onSliderKeydown"
    hideLabel
    :silent="true"
    direction="btt"
    tooltip="always"
    tooltipPlacement="left"
    height="200px"
    ref="sliderComponent"
    @update:model-value="onInputChange"
  >
    <template v-slot:tooltip>
      <div
        class="vue-slider-dot-tooltip-inner vue-slider-dot-tooltip-inner-left vue-slider-dot-tooltip-text"
      >
        <input
          ref="tooltipInput"
          v-if="isEditing"
          v-model.number="editValue"
          @blur="acceptEdit"
          @keydown.stop="onKeydown"
          type="number"
          class="tooltip-input body-1"
        />
        <span v-else class="body-1" @click="activateEdit">{{
          Math.round(currentValue)
        }}</span>
        {{ props.unit }}
      </div>
    </template>
  </vue-slider>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'
import { watchEffect } from 'vue'
import { scaleLinear } from 'd3-scale'

// Get decimal places of float (e.g. floatPrecision(54.6545) == 4)
function floatPrecision(a: number) {
  if (!isFinite(a)) return 0
  var e = 1,
    p = 0
  while (Math.round(a * e) / e !== a) {
    e *= 10
    p++
  }
  return p
}

interface Props {
  modelValue: number
  minValue: number
  maxValue: number
  unit: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  minValue: 0,
  maxValue: -10,
  unit: '',
})
const emit = defineEmits(['update:modelValue'])

const currentValue = ref(props.modelValue)
const editValue = ref(0)
const numberOfMarks = 8
const marks = ref<number[]>([])
const isEditing = ref(false)

const tooltipInput = ref<HTMLElement>()
const sliderComponent = ref<typeof VueSlider>()

const onInputChange = (value: number) => {
  currentValue.value = value
  emitModelValue(value)
}

const emitModelValue = useDebounceFn((value: number) => {
  emit('update:modelValue', value)
}, 400)

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    acceptEdit()
  } else if (e.key === 'Escape') {
    closeTooltip()
  }
}

function onSliderKeydown(e: KeyboardEvent) {
  let newValue: number | undefined = 0
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      newValue = marks.value.find((value) => value > currentValue.value)
      onInputChange(newValue ?? marks.value[marks.value.length - 1])
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      newValue = marks.value.findLast((value) => value < currentValue.value)
      onInputChange(newValue ?? marks.value[0])
      break
    case 'Enter':
      activateEdit()
      break
  }
  return false
}

const activateEdit = () => {
  isEditing.value = true
  editValue.value = Math.round(currentValue.value)
  nextTick(() => {
    if (tooltipInput.value) {
      tooltipInput.value.focus()
    }
    if (sliderComponent.value) sliderComponent.value.blur()
  })
}

const closeTooltip = () => {
  isEditing.value = false
  if (sliderComponent.value) {
    sliderComponent.value.focus({}, {})
  }
}

const acceptEdit = () => {
  if (editValue.value > props.maxValue) {
    currentValue.value = props.maxValue
  } else if (editValue.value < props.minValue) {
    currentValue.value = props.minValue
  } else {
    currentValue.value = editValue.value
  }
  emitModelValue(currentValue.value)
  closeTooltip()
}

const interval = computed(() => {
  return 10 ** -floatPrecision(props.maxValue - props.minValue)
})

const onValueChange = () => {
  currentValue.value = props.modelValue
}

watch(() => props.modelValue, onValueChange)

watchEffect(() => {
  const scale = scaleLinear(
    [props.minValue, props.maxValue],
    [props.minValue, props.maxValue],
  )
  const innerMarks = scale.ticks(numberOfMarks)
  marks.value = [props.minValue, ...innerMarks, props.maxValue]
})
</script>

<style scoped>
.vue-slider-dot-tooltip-text {
  font-family: var(--font-primary);
}

.elevation-slider {
  z-index: 2000;
  position: absolute;
  right: 5px;
  bottom: 115px;
}

.tooltip-input {
  width: 50px;
  height: 30px;
  margin: 0;
  padding: 0;
}
</style>
