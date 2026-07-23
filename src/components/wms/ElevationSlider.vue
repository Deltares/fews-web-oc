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
        :model-value="sliderModelValue"
        :max="sliderMax"
        :min="sliderMin"
        :step="sliderStep"
        :ticks="sliderTicks"
        direction="vertical"
        show-ticks="always"
        :thumb-label="false"
        thumb-color="primary"
        thumb-size="16px"
        track-size="6px"
        tick-size="3px"
        height="200px"
        hide-details
        no-keyboard
        elevation="0"
        rounded
        density="compact"
        @update:model-value="onSliderInput"
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
const sliderPos = ref(0)

const hasProvidedTicks = computed(
  () => Array.isArray(props.ticks) && props.ticks.length > 0,
)

const positions = computed(() => (props.ticks ?? []).map((_, i) => i))

const posToValue = computed(() =>
  scaleLinear<number, number>()
    .domain(positions.value)
    .range((props.ticks ?? []).map((v) => Number(v))),
)

const valueToPos = computed(() =>
  scaleLinear<number, number>()
    .domain((props.ticks ?? []).map((v) => Number(v)))
    .range(positions.value),
)

const tickLabels = computed<Record<number, string>>(() =>
  Object.fromEntries((props.ticks ?? []).map((v, i) => [i, String(v)])),
)

const activeTicks = computed(() =>
  hasProvidedTicks.value ? (props.ticks ?? []) : marks.value,
)

const sliderModelValue = computed(() =>
  hasProvidedTicks.value ? sliderPos.value : currentValue.value,
)

const sliderMin = computed(() => (hasProvidedTicks.value ? 0 : props.minValue))

const sliderMax = computed(() =>
  hasProvidedTicks.value
    ? Math.max((props.ticks?.length ?? 1) - 1, 0)
    : props.maxValue,
)

const interval = computed(() => {
  return 10 ** -floatPrecision(props.maxValue - props.minValue)
})

const sliderStep = computed(() => (hasProvidedTicks.value ? 1 : interval.value))

const sliderTicks = computed(() =>
  hasProvidedTicks.value ? positions.value : marks.value,
)

const mapPositionToValue = (position: number) => {
  const ticks = props.ticks ?? []
  if (ticks.length === 0) return currentValue.value
  const clampedPos = clamp(Math.round(position), 0, ticks.length - 1)
  const mapped = posToValue.value(clampedPos)
  return Number.isFinite(mapped) ? mapped : ticks[clampedPos]
}

const syncSliderPosFromValue = (nextValue: number) => {
  const ticks = props.ticks ?? []
  if (!hasProvidedTicks.value || ticks.length === 0) return
  const mappedPos = valueToPos.value(nextValue)
  if (Number.isFinite(mappedPos)) {
    sliderPos.value = clamp(Math.round(mappedPos), 0, ticks.length - 1)
    return
  }
  const nearestIndex = ticks.reduce(
    (bestIndex, tick, index) =>
      Math.abs(tick - nextValue) < Math.abs(ticks[bestIndex] - nextValue)
        ? index
        : bestIndex,
    0,
  )
  sliderPos.value = nearestIndex
}

const onInputChange = (value: number) => {
  const nextValue = clamp(value, props.minValue, props.maxValue)
  currentValue.value = nextValue
  emit('update:modelValue', nextValue)
}

const onSliderInput = (input: number) => {
  if (hasProvidedTicks.value) {
    sliderPos.value = clamp(Math.round(input), sliderMin.value, sliderMax.value)
    onInputChange(mapPositionToValue(sliderPos.value))
    return
  }
  onInputChange(input)
}

const resolveTickValue = (tickValue: number) => {
  if (!hasProvidedTicks.value) return tickValue
  const ticks = props.ticks ?? []
  const index = clamp(Math.round(tickValue), 0, Math.max(ticks.length - 1, 0))
  return ticks[index] ?? tickValue
}

const isRoundNumber = (value: number) => Number.isInteger(value)

const shouldShowTickLabel = (tickValue: number) => {
  if (hasProvidedTicks.value) return true
  const value = resolveTickValue(tickValue)
  const isBoundary = value === props.minValue || value === props.maxValue
  return !isBoundary || isRoundNumber(value)
}

const formatTickLabel = (tickValue: number) => {
  if (hasProvidedTicks.value) {
    const index = clamp(
      Math.round(tickValue),
      0,
      Math.max((props.ticks?.length ?? 1) - 1, 0),
    )
    return tickLabels.value[index] ?? String(resolveTickValue(tickValue))
  }
  const value = resolveTickValue(tickValue)
  return isRoundNumber(value) ? value : Number(value.toFixed(2))
}

function onSliderKeydown(e: KeyboardEvent) {
  const ticks = activeTicks.value
  let newValue: number | undefined
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      e.preventDefault()
      newValue = ticks.find((value) => value > currentValue.value)
      if (newValue !== undefined) {
        onInputChange(newValue)
      } else if (ticks.length > 0) {
        onInputChange(ticks[ticks.length - 1])
      }
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      e.preventDefault()
      newValue = ticks.findLast((value) => value < currentValue.value)
      if (newValue !== undefined) {
        onInputChange(newValue)
      } else if (ticks.length > 0) {
        onInputChange(ticks[0])
      }
      break
  }
}

const onValueChange = () => {
  currentValue.value = clamp(props.modelValue, props.minValue, props.maxValue)
  syncSliderPosFromValue(currentValue.value)
}

watch(() => props.modelValue, onValueChange, { immediate: true })

watch(
  () => props.ticks,
  () => {
    syncSliderPosFromValue(currentValue.value)
  },
  { immediate: true },
)

watchEffect(() => {
  if (hasProvidedTicks.value) {
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

.elevation-slider :deep(.v-slider-track__fill) {
  backdrop-filter: blur(5px);
  opacity: 0.8;
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
