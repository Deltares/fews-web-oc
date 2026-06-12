<template>
  <v-theme-provider :theme="isDark ? 'light' : 'dark'">
    <div class="elevation-slider-container">
      <span
        v-if="props.unit"
        class="elevation-slider__tick-label elevation-slider__unit-label"
      >
        [{{ props.unit }}]
      </span>
      <v-slider
        ref="sliderComponent"
        class="elevation-slider"
        :model-value="currentValue"
        :max="maxValue"
        :min="minValue"
        :interval="interval"
        :ticks="marks"
        direction="vertical"
        show-ticks="always"
        :thumb-label="false"
        thumb-color="primary"
        thumb-size="16px"
        height="200px"
        hide-details
        no-keyboard
        elevetion="2"
        density="compact"
        @update:model-value="onInputChange"
        @keydown="onSliderKeydown"
      >
        <template #tick-label="{ tick }">
          <span
            v-if="shouldShowTickLabel(tick.value)"
            class="elevation-slider__tick-label"
          >
            {{ formatTickLabel(tick.value) }}
          </span>
        </template>
      </v-slider>
    </div>
  </v-theme-provider>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { scaleLinear } from 'd3-scale'
import { clamp, floatPrecision } from '@/lib/utils/math'
import { useDark } from '@/services/useDark'

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

const currentValue = ref(
  clamp(props.modelValue, props.minValue, props.maxValue),
)

const isDark = useDark()

const numberOfMarks = 8
const marks = ref<number[]>([])

const onInputChange = (value: number) => {
  const nextValue = clamp(value, props.minValue, props.maxValue)
  currentValue.value = nextValue
  emit('update:modelValue', nextValue)
}

const isRoundNumber = (value: number) => Number.isInteger(value)

const shouldShowTickLabel = (value: number) => {
  const isBoundary = value === props.minValue || value === props.maxValue
  return !isBoundary || isRoundNumber(value)
}

const formatTickLabel = (value: number) => {
  return isRoundNumber(value) ? value : Number(value.toFixed(2))
}

function onSliderKeydown(e: KeyboardEvent) {
  let newValue: number | undefined
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      e.preventDefault()
      newValue = marks.value.find((value) => value > currentValue.value)
      if (newValue !== undefined) {
        onInputChange(newValue)
      } else if (marks.value.length > 0) {
        onInputChange(marks.value[marks.value.length - 1])
      }
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      e.preventDefault()
      newValue = marks.value.findLast((value) => value < currentValue.value)
      if (newValue !== undefined) {
        onInputChange(newValue)
      } else if (marks.value.length > 0) {
        onInputChange(marks.value[0])
      }
      break
  }
}

const interval = computed(() => {
  return 10 ** -floatPrecision(props.maxValue - props.minValue)
})

const onValueChange = () => {
  currentValue.value = clamp(props.modelValue, props.minValue, props.maxValue)
}

watch(() => props.modelValue, onValueChange, { immediate: true })

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
.elevation-slider__thumb-label {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  font-family: var(--font-primary);
  white-space: nowrap;
}

.elevation-slider-container {
  z-index: 2000;
  position: absolute;
  right: 25px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.elevation-slider {
  position: relative;
}

.elevation-slider__unit-label {
  padding-left: 50px;
  margin-bottom: 0px;
}

.elevation-slider__tick-label {
  color: white;
  font-family: var(--font-primary);
  font-size: 0.9rem;
  text-shadow:
    -1px 0 1px rgba(0, 0, 0, 0.6),
    1px 0 1px rgba(0, 0, 0, 0.6),
    0 1px 1px rgba(0, 0, 0, 0.6),
    0 -1px 1px rgba(0, 0, 0, 0.6);
}
</style>
