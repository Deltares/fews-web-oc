<template>
  <vue-slider
    class="elevation-slider"
    :model-value="currentValue"
    :duration="0"
    :max="maxValue"
    :min="minValue"
    :marks="marks"
    :interval="interval"
    :keydownHook="onSliderKeydown"
    hideLabel
    silent
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
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'
import { scaleLinear } from 'd3-scale'
import { clamp, floatPrecision } from '@/lib/utils/math'

interface Props {
  modelValue: number
  minValue: number
  maxValue: number
  unit: string
  ticks?: number[]
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
  emit('update:modelValue', value)
}

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
  currentValue.value = clamp(editValue.value, props.minValue, props.maxValue)
  emit('update:modelValue', currentValue.value)
  closeTooltip()
}

const interval = computed(() => {
  return 10 ** -floatPrecision(props.maxValue - props.minValue)
})

const onValueChange = () => {
  currentValue.value = clamp(props.modelValue, props.minValue, props.maxValue)
}

watch(() => props.modelValue, onValueChange)

watchEffect(() => {
  if (props.ticks) {
    marks.value = props.ticks
    return
  }

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
