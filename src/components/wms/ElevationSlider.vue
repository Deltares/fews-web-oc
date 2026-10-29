<template>
  <div class="elevation-slider">
    <v-slider
      ref="sliderComponent"
      class="elevation-slider__slider"
      :model-value="sliderModelValue"
      :max="sliderMax"
      :min="sliderMin"
      :step="sliderStep"
      :ticks="sliderTicks"
      direction="vertical"
      show-ticks="always"
      thumb-label="always"
      thumb-size="14"
      track-size="4"
      tick-size="4"
      height="200px"
      hide-details
      no-keyboard
      elevation="0"
      :ripple="false"
      @update:model-value="onSliderInput"
      @keydown="onSliderKeydown"
    >
      <template #thumb-label>
        <v-theme-provider
          with-background
          class="elevation-slider__tooltip"
          @mousedown.stop
          @touchstart.stop
          @pointerdown.stop
        >
          <label class="d-none" for="elevation-slider-tooltip-input">
            Elevation
          </label>
          <input
            id="elevation-slider-tooltip-input"
            ref="tooltipInput"
            v-if="isEditing"
            v-model.number="editValue"
            @blur="acceptEdit"
            @keydown.stop="onKeydown"
            type="number"
            class="elevation-slider__tooltip-input"
          />
          <button
            v-else
            type="button"
            class="elevation-slider__edit-button"
            @click="activateEdit"
            @keydown.enter.stop.prevent="activateEdit"
            @keydown.space.stop.prevent="activateEdit"
          >
            {{ Math.round(currentValue) }}
          </button>
          {{ props.unit }}
        </v-theme-provider>
      </template>
      <template #tick-label></template>
    </v-slider>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import { scaleLinear } from 'd3-scale'
import { clamp, floatPrecision } from '@/lib/utils/math'

interface Props {
  modelValue?: number
  minValue?: number
  maxValue?: number
  unit?: string
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
const editValue = ref(0)
const isEditing = ref(false)

const tooltipInput = ref<HTMLInputElement>()
const sliderComponent = ref<{ focus: () => void }>()

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
  syncSliderPosFromValue(nextValue)
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

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    acceptEdit()
  } else if (e.key === 'Escape') {
    closeTooltip()
  }
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
    case 'Enter':
      e.preventDefault()
      activateEdit()
      break
  }
}

const activateEdit = () => {
  isEditing.value = true
  editValue.value = Math.round(currentValue.value)
  nextTick(() => {
    tooltipInput.value?.focus()
    tooltipInput.value?.select()
  })
}

const closeTooltip = () => {
  if (!isEditing.value) return
  isEditing.value = false
  sliderComponent.value?.focus()
}

const acceptEdit = () => {
  if (!isEditing.value) return
  onInputChange(editValue.value)
  closeTooltip()
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
.elevation-slider {
  z-index: 2000;
  position: absolute;
  right: 5px;
  bottom: 115px;
  padding: 7px;
}

.elevation-slider__slider {
  margin: 0;
}

/* Styled after the vue-slider antd theme, using the Vuetify theme colours */
.elevation-slider__slider {
  --elevation-slider-rail: color-mix(
    in srgb,
    rgb(var(--v-theme-on-surface)) 8%,
    rgb(var(--v-theme-surface))
  );
  --elevation-slider-rail-hover: color-mix(
    in srgb,
    rgb(var(--v-theme-on-surface)) 16%,
    rgb(var(--v-theme-surface))
  );
  --elevation-slider-process: color-mix(
    in srgb,
    rgb(var(--v-theme-primary)) 50%,
    rgb(var(--v-theme-surface))
  );
  --elevation-slider-process-hover: color-mix(
    in srgb,
    rgb(var(--v-theme-primary)) 75%,
    rgb(var(--v-theme-surface))
  );
  --elevation-slider-active: rgb(var(--v-theme-primary));
}

.elevation-slider__slider:hover {
  --elevation-slider-rail: var(--elevation-slider-rail-hover);
  --elevation-slider-process: var(--elevation-slider-process-hover);
}

.elevation-slider__slider :deep(.v-input__control) {
  min-height: 200px;
}

.elevation-slider__slider :deep(.v-slider-track) {
  border-radius: 15px;
}

.elevation-slider__slider :deep(.v-slider-track__background) {
  background-color: var(--elevation-slider-rail);
  opacity: 1;
  transition: background-color 0.3s;
}

.elevation-slider__slider :deep(.v-slider-track__fill) {
  background-color: var(--elevation-slider-process);
  transition: background-color 0.3s;
}

.elevation-slider__slider :deep(.v-slider-track__tick) {
  border-radius: 50%;
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 0 0 2px var(--elevation-slider-rail);
}

.elevation-slider__slider :deep(.v-slider-track__tick--filled) {
  box-shadow: 0 0 0 2px var(--elevation-slider-process);
}

.elevation-slider__slider :deep(.v-slider-thumb__surface) {
  box-sizing: border-box;
  background-color: rgb(var(--v-theme-surface));
  border: 2px solid var(--elevation-slider-process);
  transition:
    box-shadow 0.3s,
    border-color 0.3s;
}

.elevation-slider__slider :deep(.v-slider-thumb__surface::before),
.elevation-slider__slider :deep(.v-slider-thumb__surface::after) {
  display: none;
}

.elevation-slider__slider :deep(.v-slider-thumb:hover .v-slider-thumb__surface),
.elevation-slider__slider
  :deep(.v-slider-thumb--focused .v-slider-thumb__surface) {
  border-color: var(--elevation-slider-active);
}

.elevation-slider__slider
  :deep(.v-slider-thumb--focused .v-slider-thumb__surface) {
  box-shadow: 0 0 0 5px rgba(var(--v-theme-primary), 0.2);
}

/* Tooltip on the left of the thumb */
.elevation-slider__slider :deep(.v-slider-thumb__label) {
  top: 0;
  left: auto;
  right: calc(var(--v-slider-thumb-size) + 8px);
  transform: translateY(-50%);
  height: auto;
  min-width: 0;
  padding: 0;
  background: transparent;
}

.elevation-slider__slider
  :deep(.v-slider-thumb__label > .v-slider-thumb__label-wedge) {
  display: none;
}

/* Same style as the map control chips (ControlChip.vue) */
.elevation-slider__tooltip {
  gap: 4px;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  border-radius: 5px;
  font-size: 0.825rem;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface));
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  /* Tint of the tonal v-chip underlay */
  background-image: linear-gradient(
    rgba(var(--v-theme-on-surface), var(--v-activated-opacity)),
    rgba(var(--v-theme-on-surface), var(--v-activated-opacity))
  );
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  font-family: var(--font-primary);
  cursor: default;
}

/* Vuetify hides every input inside the slider container */
.elevation-slider__slider .elevation-slider__tooltip-input {
  display: inline-block;
  width: 50px;
  margin: 0;
  padding: 0;
  border: 0;
  border-bottom: 1px solid currentColor;
  outline: none;
  color: inherit;
  background: transparent;
  font: inherit;
}

.elevation-slider__edit-button {
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
</style>
