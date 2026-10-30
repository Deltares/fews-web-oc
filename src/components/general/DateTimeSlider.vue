<template>
  <div class="datetime-slider" aria-labelledby="date time slider">
    <div
      ref="sliderContainer"
      class="slider-container"
      @keydown="isKeyboardActive = true"
      @pointerdown="isKeyboardActive = false"
    >
      <v-slider
        class="web-oc-slider datetime-slider__track"
        :class="{ 'datetime-slider__track--keyboard': isKeyboardActive }"
        v-model="dateIndex"
        :min="0"
        :max="maxIndex"
        :step="1"
        :ticks="tickValues"
        show-ticks="always"
        thumb-label="always"
        thumb-size="14"
        track-size="4"
        tick-size="4"
        hide-details
        elevation="0"
        :ripple="false"
        @update:model-value="stopFollowNow"
      >
        <template #thumb-label="{ modelValue }">
          <v-theme-provider
            with-background
            class="web-oc-slider-chip web-oc-slider-chip--arrow-down"
          >
            {{
              dates[modelValue] ? toDisplayLocaleString(dates[modelValue]) : ''
            }}
          </v-theme-provider>
        </template>
        <template #tick-label="{ tick }">
          <v-theme-provider
            v-if="markLabels[tick.value]"
            with-background
            class="web-oc-slider-chip"
          >
            {{ markLabels[tick.value] }}
          </v-theme-provider>
        </template>
      </v-slider>
      <slot name="below-track"></slot>
    </div>
    <div class="datetime-slider__actions">
      <slot name="prepend"></slot>
      <div class="now-tracking-control">
        <v-tooltip :text="nowTrackingTooltip" location="top">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              density="compact"
              variant="text"
              :icon="nowButtonIcon"
              :color="nowButtonColor"
              @click="toggleFollowNow"
            />
          </template>
        </v-tooltip>
        <span class="datetime-slider__datefield">{{ dateString }}</span>
      </div>
      <v-spacer />
      <div class="play-controls">
        <v-menu
          offset="25"
          transition="fade-transition"
          v-if="!hideSpeedControls"
        >
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" density="compact" variant="text" icon>
              <v-icon>mdi-play-speed</v-icon>
              <v-tooltip location="top" activator="parent">
                <span>Playback speed</span>
              </v-tooltip>
            </v-btn>
          </template>

          <v-list class="pa-1">
            <v-list-item
              v-for="speed in availableSpeeds"
              :key="speed"
              :active="speed === currentSpeed"
              rounded
              density="compact"
              @click="setSpeed(speed)"
              :title="formatSpeed(speed)"
            />
          </v-list>
        </v-menu>
        <v-btn
          density="compact"
          variant="text"
          icon="mdi-skip-previous"
          @mousedown="stepBackward"
          @mouseup="stopPlay"
        />
        <v-btn
          density="compact"
          variant="text"
          :icon="playButtonIcon"
          :color="playButtonColor"
          @click="togglePlay"
        />
        <v-btn
          density="compact"
          variant="text"
          icon="mdi-skip-next"
          @mousedown="stepForward"
          @mouseup="stopPlay"
        />
      </div>
      <slot name="append"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type WatchHandle,
} from 'vue'
import { useElementSize } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import { toMultiScaleDateLabel } from '@/lib/date'
import { toDisplayLocaleString } from '@/lib/date/timeZone'
import { getEquallySpacedSliderTicks } from '@/lib/date/sliderTicks'
import { findDateIndex } from '@/lib/utils/dates'
import { systemTimeAuthority } from '@/services/system-time'
import '@/assets/slider.css'

interface Properties {
  selectedDate?: Date
  dates: Date[]
  now?: Date
  isLoading?: boolean
  playInterval?: number
  followNowInterval?: number
  hideSpeedControls?: boolean
  autoPlay?: boolean
}

const props = withDefaults(defineProps<Properties>(), {
  isLoading: false,
  playInterval: 1000,
  followNowInterval: 60000,
  hideSpeedControls: false,
  autoPlay: false,
})
const emit = defineEmits(['update:selectedDate'])

const { t } = useI18n()

const doFollowNow = defineModel<boolean>('doFollowNow', { default: true })
const showSnapshotFrames = defineModel<boolean>('showSnapshotFrames', {
  default: false,
})

// Step size when playing an animation, and when clicking the previous and next frame buttons.
const playIncrement = 1
const stepIncrement = 1
const dateIndex = ref(0)

const defaultSpeed = 1
const currentSpeed = ref(defaultSpeed)
const availableSpeeds = [0.5, 1, 2, 4]

const playTimeoutTimer = ref<ReturnType<typeof setTimeout>>()

let followNowIntervalTimer: ReturnType<typeof setInterval> | null = null
const sliderContainer = ref<HTMLElement>()
const dragGestureStartY = ref(0)
const isTrackingDragGesture = ref(false)

const DRAG_UP_THRESHOLD_PX = 24
// Roughly the width of a date label, so that labels shown together do not overlap
const MIN_MARK_LABEL_SPACING_PX = 100

const { width: sliderWidth } = useElementSize(sliderContainer)
// Show the thumb label while the slider is operated with the keyboard
const isKeyboardActive = ref(false)

const markLabels = computed<Record<number, string>>(() => {
  const ticks = getEquallySpacedSliderTicks(
    props.dates,
    sliderWidth.value,
    MIN_MARK_LABEL_SPACING_PX,
  )
  return Object.fromEntries(
    ticks.map(({ index, tick }) => [
      index,
      toMultiScaleDateLabel(props.dates[index], tick),
    ]),
  )
})

const tickValues = computed(() => Object.keys(markLabels.value).map(Number))

// Synchronise selectedDate property and local index variable.
watch(dateIndex, (index) => {
  emit('update:selectedDate', props.dates[index])
})

watch(
  () => props.selectedDate,
  (selectedDate) => {
    if (selectedDate === undefined) return
    let index = findDateIndex(props.dates, selectedDate)
    if (index === dateIndex.value) return
    dateIndex.value = index
  },
)

// When the input dates change, make sure the selected index is updated to point to the correct
// member of the new dates array.
watch(
  () => props.dates,
  () => {
    if (doFollowNow.value) {
      setDateToNow()
      if (
        props.selectedDate?.getTime() !==
        props.dates[dateIndex.value]?.getTime()
      ) {
        emit('update:selectedDate', props.dates[dateIndex.value])
      }
    } else if (props.selectedDate) {
      const oldDate = props.selectedDate
      dateIndex.value = findDateIndex(props.dates, oldDate)
    }
  },
  { immediate: true },
)

const maxIndex = computed(() => {
  if (props.dates === undefined) {
    return 0
  }
  return Math.max(props.dates.length - 1, 0)
})

// Now and play button styling is dependent on properties.
const nowButtonIcon = computed(() => {
  if (props.isLoading && !playTimeoutTimer.value) return 'mdi-loading mdi-spin'
  const hasSpecifiedNow = props.now !== undefined
  const iconName = 'mdi-clock'
  return hasSpecifiedNow ? iconName : `${iconName}-outline`
})
const playButtonIcon = computed(() =>
  playTimeoutTimer.value ? 'mdi-pause' : 'mdi-play',
)
const nowButtonColor = computed(() =>
  doFollowNow.value ? 'primary' : undefined,
)
const playButtonColor = computed(() =>
  playTimeoutTimer.value ? 'primary' : undefined,
)

const dateString = computed(() =>
  props.dates[dateIndex.value]
    ? toDisplayLocaleString(props.dates[dateIndex.value])
    : '',
)

// Tooltip text for now-tracking control depending on if we use Date.now() or specified time
const nowTrackingTooltip = computed(() => {
  if (doFollowNow.value) {
    if (props.now) {
      return t('timeControl.trackingSpecifiedTime')
    }
    return t('timeControl.trackingCurrentTime')
  }

  if (props.now) {
    return t('timeControl.followSpecifiedTime')
  }
  return t('timeControl.followCurrentTime')
})

function toggleFollowNow(): void {
  doFollowNow.value = !doFollowNow.value
}

watch(
  doFollowNow,
  (newVal) => {
    if (newVal) {
      startFollowTimer()
    } else {
      stopFollowTimer()
    }
  },
  { immediate: true },
)

function startFollowTimer(): void {
  stopPlay()
  setDateToNow()
  followNowIntervalTimer = setInterval(setDateToNow, props.followNowInterval)
}

function stopFollowNow(): void {
  doFollowNow.value = false
}

function stopFollowTimer(): void {
  if (followNowIntervalTimer) clearInterval(followNowIntervalTimer)
  followNowIntervalTimer = null
}

function setDateToNow(): void {
  const now = props.now ?? systemTimeAuthority.now()
  dateIndex.value = findDateIndex(props.dates, now)
}

function isSliderGestureElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('.v-slider-thumb, .v-slider-track, .v-slider'))
}

function onPointerDown(event: PointerEvent): void {
  if (!isSliderGestureElement(event.target)) return

  dragGestureStartY.value = event.clientY
  isTrackingDragGesture.value = true
}

function onPointerMove(event: PointerEvent): void {
  if (!isTrackingDragGesture.value) return

  const dragUpDistance = dragGestureStartY.value - event.clientY
  if (dragUpDistance >= DRAG_UP_THRESHOLD_PX) {
    showSnapshotFrames.value = true
  }
}

function stopDragGestureTracking(): void {
  isTrackingDragGesture.value = false
}

function onPointerUp(): void {
  stopDragGestureTracking()
}

function togglePlay(): void {
  if (playTimeoutTimer.value) {
    stopPlay()
  } else {
    startPlay()
  }
}

function startPlay(): void {
  stopFollowNow()
  play()
}

// Watch handle allows for unwatching a watch
// https://vuejs.org/guide/essentials/watchers.html#stopping-a-watcher
const playLoadingWatchHandle = ref<WatchHandle>()

// Stops watching the loading state and cleans up the watch handle
function unwatchPlayLoading(): void {
  playLoadingWatchHandle.value?.()
  playLoadingWatchHandle.value = undefined
}

function stopPlay(): void {
  if (playTimeoutTimer.value) {
    unwatchPlayLoading()
    clearTimeout(playTimeoutTimer.value)
    playTimeoutTimer.value = undefined
  }
}

function play(): void {
  if (props.isLoading) {
    // Watch the loading state and wait until it finishes before continuing
    playLoadingWatchHandle.value = watch(
      () => props.isLoading,
      (newVal) => {
        if (!newVal) {
          unwatchPlayLoading()
          // Proceed with the play process once loading is complete
          continuePlay()
        }
      },
    )
  } else {
    // Directly proceed if not loading
    continuePlay()
  }
}

function continuePlay(): void {
  if (dateIndex.value === maxIndex.value) {
    dateIndex.value = 0
  } else {
    increment(playIncrement)
  }
  playTimeoutTimer.value = setTimeout(
    play,
    props.playInterval * (1 / currentSpeed.value),
  )
}

function stepBackward(): void {
  stopFollowNow()
  decrement(stepIncrement)
}

function stepForward(): void {
  stopFollowNow()
  increment(stepIncrement)
}

function decrement(step: number): void {
  dateIndex.value = Math.max(dateIndex.value - step, 0)
}

function increment(step: number): void {
  dateIndex.value = Math.min(dateIndex.value + step, maxIndex.value)
}

function setSpeed(speed: number) {
  currentSpeed.value = speed
}

function formatSpeed(speed: number) {
  return speed === defaultSpeed ? 'Normal' : `${speed}x`
}

watch(
  () => props.autoPlay,
  () => {
    if (props.autoPlay) startPlay()
  },
  { immediate: true },
)

onMounted(() => {
  sliderContainer.value?.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
})

onUnmounted(() => {
  sliderContainer.value?.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  stopDragGestureTracking()
  showSnapshotFrames.value = false
  stopFollowTimer()
})
</script>

<style scoped>
/* A parent can round the bottom corners with --datetime-slider-corner-radius,
   e.g. to follow the rounded corners of the window. The top corners are
   rounded up to 15px. The content is inset to stay clear of the corners.
   A square slider placed in the rounded corners of a screen can inset its
   content with --datetime-slider-safe-corner-radius instead. */
.datetime-slider {
  --_corner-radius: var(--datetime-slider-corner-radius, 0px);
  --_safe-corner-radius: var(
    --datetime-slider-safe-corner-radius,
    var(--_corner-radius)
  );
  --_top-corner-radius: min(var(--_corner-radius), 15px);
  --datetime-slider-inline-padding: max(
    10px,
    calc(var(--_safe-corner-radius) * 0.35),
    calc(var(--_top-corner-radius) - 1px)
  );
  --datetime-slider-bottom-padding: max(
    6px,
    calc(var(--_safe-corner-radius) * 0.35),
    env(safe-area-inset-bottom, 0px)
  );
  border-radius: var(--_top-corner-radius) var(--_top-corner-radius)
    var(--_corner-radius) var(--_corner-radius);
}

.slider-container {
  position: relative;
  padding: 0px var(--datetime-slider-inline-padding);
}

.datetime-slider__actions {
  display: flex;
  flex-direction: row;
  height: calc(32px + var(--datetime-slider-bottom-padding) - 6px);
  padding: 0px var(--datetime-slider-inline-padding)
    var(--datetime-slider-bottom-padding);
}

.datetime-slider__datefield {
  margin: auto;
  width: 20ch;
  flex: 2 0 20%;
}

.now-tracking-control {
  display: flex;
  flex-direction: row;
  gap: 15px;
}

.play-controls {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

/* Colours for the shared slider style (assets/slider.css) */
.datetime-slider__track {
  --web-oc-slider-rail-hover: color-mix(
    in srgb,
    rgb(var(--v-theme-on-surface)) 24%,
    rgb(var(--v-theme-surface))
  );
  --web-oc-slider-mark: color-mix(
    in srgb,
    rgb(var(--v-theme-on-surface)) 30%,
    rgb(var(--v-theme-surface))
  );
}

.v-theme--light .datetime-slider__track {
  --web-oc-slider-rail: rgb(var(--v-theme-surface));
  --web-oc-slider-rail-hover: color-mix(
    in srgb,
    rgb(var(--v-theme-on-surface)) 8%,
    rgb(var(--v-theme-surface))
  );
}

/* The track spans the full width, so it lines up with the below-track slot */
.datetime-slider__track :deep(.v-input__control) {
  min-height: 18px;
  margin: 0;
}

/* Vuetify insets the first and last tick, put them at the track ends */
.datetime-slider__track :deep(.v-slider-track__tick--first) {
  margin-inline-start: 0;
}

.datetime-slider__track :deep(.v-slider-track__tick--last) {
  margin-inline-start: 100%;
}

/* Larger hover area around the small tick dots */
.datetime-slider__track :deep(.v-slider-track__tick::after) {
  content: '';
  position: absolute;
  inset: -6px;
}

/* Tooltip above the thumb, with the arrow tip touching the thumb */
.datetime-slider__track :deep(.v-slider-thumb__label) {
  bottom: 6px;
}

/* Vuetify's hover mode hides the label when the pointer leaves the thumb
   during a drag, so show it on hover, while dragging and on keyboard use.
   :focus-visible is not used, Vuetify focuses the thumb on mouse presses too */
.datetime-slider__track :deep(.v-slider-thumb__label-container) {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s,
    visibility 0.2s;
}

.datetime-slider__track
  :deep(.v-slider-thumb:hover .v-slider-thumb__label-container),
.datetime-slider__track
  :deep(.v-slider-thumb--pressed .v-slider-thumb__label-container),
.datetime-slider__track--keyboard
  :deep(.v-slider-thumb--focused .v-slider-thumb__label-container) {
  opacity: 1;
  visibility: visible;
}

/* Same height above the track as the thumb label */
.datetime-slider__track :deep(.v-slider-track__tick-label) {
  bottom: 100%;
  left: 50%;
  margin: 0 0 11px 0;
  transform: translateX(-50%);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.3s;
}

/* Hovering any dot shows the labels of all dots */
.datetime-slider__track
  :deep(
    .v-slider-track__ticks:has(.v-slider-track__tick:hover)
      .v-slider-track__tick-label
  ) {
  opacity: 1;
  visibility: visible;
}
</style>
