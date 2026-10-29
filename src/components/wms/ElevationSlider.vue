<template>
  <div ref="rootElement" class="elevation-slider">
    <v-slider
      ref="sliderComponent"
      class="web-oc-slider elevation-slider__slider"
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
          class="web-oc-slider-chip web-oc-slider-chip--arrow-right elevation-slider__tooltip"
          @mousedown.stop
          @touchstart.stop
          @pointerdown.stop
        >
          <!-- Text input with the same style as TableCellEdit, a number input
               shows spin buttons and Edge may use a comma as decimal separator -->
          <div v-if="isEditing" class="elevation-slider__tooltip-field">
            <input
              ref="tooltipInput"
              v-model="editValue"
              aria-label="Elevation"
              class="elevation-slider__tooltip-input"
              type="text"
              inputmode="decimal"
              @blur="onEditBlur"
              @keydown.stop="onKeydown"
            />
            <!-- Prevent mousedown so the input keeps focus -->
            <div class="elevation-slider__tooltip-steppers">
              <button
                type="button"
                tabindex="-1"
                aria-label="Increase elevation"
                @mousedown.prevent
                @click="stepEditValue(1)"
              >
                <v-icon icon="mdi-chevron-up" size="12" />
              </button>
              <button
                type="button"
                tabindex="-1"
                aria-label="Decrease elevation"
                @mousedown.prevent
                @click="stepEditValue(-1)"
              >
                <v-icon icon="mdi-chevron-down" size="12" />
              </button>
            </div>
          </div>
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
import '@/assets/slider.css'

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

const currentValue = ref(props.modelValue)
const editValue = ref('')
const isEditing = ref(false)

const rootElement = ref<HTMLElement>()
const tooltipInput = ref<HTMLInputElement>()
const sliderComponent = ref<{ focus: () => void }>()

const numberOfMarks = 8
const marks = ref<number[]>([])
const sliderPos = ref(0)

// Sort ascending so the lowest tick is at the bottom, as in min/max mode
const sortedTicks = computed(() =>
  [...(props.ticks ?? [])].map(Number).sort((a, b) => a - b),
)

const hasProvidedTicks = computed(() => sortedTicks.value.length > 0)

const positions = computed(() => sortedTicks.value.map((_, i) => i))

const activeTicks = computed(() =>
  hasProvidedTicks.value ? sortedTicks.value : marks.value,
)

const sliderModelValue = computed(() =>
  hasProvidedTicks.value ? sliderPos.value : currentValue.value,
)

const sliderMin = computed(() => (hasProvidedTicks.value ? 0 : props.minValue))

const sliderMax = computed(() =>
  hasProvidedTicks.value ? sortedTicks.value.length - 1 : props.maxValue,
)

const interval = computed(() => {
  return 10 ** -floatPrecision(props.maxValue - props.minValue)
})

const sliderStep = computed(() => (hasProvidedTicks.value ? 1 : interval.value))

const sliderTicks = computed(() =>
  hasProvidedTicks.value ? positions.value : marks.value,
)

const nearestTickIndex = (value: number) => {
  const ticks = sortedTicks.value
  return ticks.reduce(
    (bestIndex, tick, index) =>
      Math.abs(tick - value) < Math.abs(ticks[bestIndex] - value)
        ? index
        : bestIndex,
    0,
  )
}

const syncSliderPosFromValue = (value: number) => {
  if (!hasProvidedTicks.value) return
  sliderPos.value = nearestTickIndex(value)
}

const onInputChange = (value: number) => {
  let nextValue = clamp(value, props.minValue, props.maxValue)
  // With ticks only the tick values are valid elevations
  if (hasProvidedTicks.value) {
    nextValue = sortedTicks.value[nearestTickIndex(nextValue)]
  }
  currentValue.value = nextValue
  syncSliderPosFromValue(nextValue)
  emit('update:modelValue', nextValue)
}

const onSliderInput = (input: number) => {
  if (hasProvidedTicks.value) {
    onInputChange(sortedTicks.value[input])
    return
  }
  onInputChange(input)
}

// Accept both '.' and ',' as decimal separator, reject anything else
const parseEditValue = (): number | undefined => {
  const text = editValue.value.trim().replace(',', '.')
  if (text === '') return undefined
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    acceptEdit()
  } else if (e.key === 'Escape') {
    closeTooltip()
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    stepEditValue(e.key === 'ArrowUp' ? 1 : -1)
  }
}

const stepEditValue = (direction: 1 | -1) => {
  const value = parseEditValue() ?? Math.round(currentValue.value)
  // Round to avoid floating point noise when stepping from decimal values
  const next = Math.round((value + direction) * 1e6) / 1e6
  editValue.value = String(clamp(next, props.minValue, props.maxValue))
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
  editValue.value = String(Math.round(currentValue.value))
  nextTick(() => {
    tooltipInput.value?.focus()
    tooltipInput.value?.select()
  })
}

const closeTooltip = (refocusSlider = true) => {
  if (!isEditing.value) return
  isEditing.value = false
  if (refocusSlider) sliderComponent.value?.focus()
}

const commitEdit = () => {
  const value = parseEditValue()
  if (value !== undefined) onInputChange(value)
}

const acceptEdit = () => {
  if (!isEditing.value) return
  commitEdit()
  closeTooltip()
}

// Focus moved elsewhere, so commit without pulling focus back to the slider
const onEditBlur = () => {
  if (!isEditing.value) return
  commitEdit()
  closeTooltip(false)
}

const onValueChange = () => {
  currentValue.value = clamp(props.modelValue, props.minValue, props.maxValue)
  syncSliderPosFromValue(currentValue.value)
}

watch(() => props.modelValue, onValueChange, { immediate: true })

watch(sortedTicks, () => syncSliderPosFromValue(currentValue.value))

// In ticks mode the slider value is a tick index, so expose the elevation
// to assistive technology through aria-valuetext
watchEffect(() => {
  const thumb = rootElement.value?.querySelector('.v-slider-thumb')
  thumb?.setAttribute(
    'aria-valuetext',
    `${Math.round(currentValue.value)} ${props.unit}`.trim(),
  )
})

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

/* Colours for the shared slider style (assets/slider.css) */
.elevation-slider__slider {
  --web-oc-slider-rail: color-mix(
    in srgb,
    rgb(var(--v-theme-on-surface)) 8%,
    rgb(var(--v-theme-surface))
  );
  --web-oc-slider-rail-hover: color-mix(
    in srgb,
    rgb(var(--v-theme-on-surface)) 16%,
    rgb(var(--v-theme-surface))
  );
  --web-oc-slider-fill: color-mix(
    in srgb,
    rgb(var(--v-theme-primary)) 50%,
    rgb(var(--v-theme-surface))
  );
  --web-oc-slider-fill-hover: color-mix(
    in srgb,
    rgb(var(--v-theme-primary)) 75%,
    rgb(var(--v-theme-surface))
  );
  --web-oc-slider-thumb-active: rgb(var(--v-theme-primary));
}

.elevation-slider__slider > :deep(.v-input__control) {
  min-height: 200px;
}

/* Tooltip on the left of the thumb, with the arrow tip touching the thumb */
.elevation-slider__slider :deep(.v-slider-thumb__label) {
  top: 0;
  left: auto;
  right: calc(var(--v-slider-thumb-size) + 6px);
  transform: translateY(-50%);
}

.elevation-slider__tooltip {
  gap: 4px;
  font-family: var(--font-primary);
  cursor: default;
}

/* Same style as the TableCellEdit inputs */
.elevation-slider__tooltip-field {
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  height: 24px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background-color: rgb(var(--v-theme-surface));
  transition:
    border-color 120ms ease,
    background-color 120ms ease;
}

.elevation-slider__tooltip-field:hover:not(:focus-within) {
  border-color: rgba(var(--v-theme-on-surface), 0.6);
}

.elevation-slider__tooltip-field:focus-within {
  border-color: transparent;
  outline: 1px solid rgb(var(--v-theme-primary));
  outline-offset: -1px;
}

.elevation-slider__slider .elevation-slider__tooltip-input {
  /* Vuetify hides every input inside the slider container */
  display: block;
  width: 6ch;
  padding: 0px 2px;
  border: 0;
  outline: none;
  color: currentColor;
  background: transparent;
  font: inherit;
  line-height: 20px;
}

/* Inset in the field, like the spin buttons of a number input */
.elevation-slider__tooltip-steppers {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px;
}

.elevation-slider__tooltip-steppers > button {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  width: 14px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 2px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.elevation-slider__tooltip-steppers > button:hover {
  background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
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
