<template>
  <div class="datetime-slider" aria-labelledby="date time slider">
    <div class="slider-container" :dark="isDark ? 'light' : 'dark'">
      <v-theme-provider :with-background="false">
        <v-slider
          class="datetime-slider__track"
          :class="{ 'datetime-slider__track--hover': isHovering }"
          :model-value="dateIndex"
          :min="0"
          :max="maxIndex"
          :step="1"
          :ticks="tickValues"
          tick-size="4"
          indent-details
          show-ticks="always"
          show-thumb-label="active"
          :thumb-label="!hideLabel"
          thumb-size="14"
          thumb-color="primary"
          hide-details
          density="compact"
          rounded="0"
          height="0"
          @update:model-value="onSliderInput"
          @mouseenter="onSliderMouseEnter"
          @mouseleave="onSliderMouseLeave"
        >
          <template #thumb-label="{ modelValue }">
            <span class="datetime-slider__thumb-label">
              {{ getDateLabel(modelValue) }}
            </span>
          </template>
          <template #tick-label="{ tick }">
            <span
              v-if="markLabels[tick.value]"
              class="datetime-slider__tick-label"
            >
              {{ markLabels[tick.value] }}
            </span>
          </template>
        </v-slider>

        <div class="datetime-slider__below-track">
          <slot name="below-track"></slot>
        </div>
      </v-theme-provider>
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
import { computed, onUnmounted, ref, watch, type WatchHandle } from 'vue'
import { scaleTime } from 'd3-scale'
import { DateTime } from 'luxon'
import { useI18n } from 'vue-i18n'

import { findDateIndex } from '@/lib/utils/dates'
import { useDark } from '@/services/useDark'

interface Properties {
  selectedDate?: Date
  dates: Date[]
  now?: Date
  isLoading?: boolean
  playInterval?: number
  followNowInterval?: number
  hideSpeedControls?: boolean
}

const props = withDefaults(defineProps<Properties>(), {
  isLoading: false,
  playInterval: 1000,
  followNowInterval: 60000,
  hideSpeedControls: false,
})
const emit = defineEmits(['update:selectedDate'])

const { t } = useI18n()

const doFollowNow = defineModel<boolean>('doFollowNow', { default: true })

const isDark = useDark()

// Step size when playing an animation, and when clicking the previous and next frame buttons.
const playIncrement = 1
const stepIncrement = 1
const dateIndex = ref(0)

const defaultSpeed = 1
const currentSpeed = ref(defaultSpeed)
const availableSpeeds = [0.5, 1, 2, 4]

const playTimeoutTimer = ref<ReturnType<typeof setTimeout>>()

let followNowIntervalTimer: ReturnType<typeof setInterval> | null = null

const hideLabel = ref(true)
const isHovering = ref(false)

const markLabels = computed<Record<number, string>>(() => {
  const dayMarks: Record<number, string> = {}
  const dateScale = scaleTime().domain(props.dates)
  const ticks = dateScale.ticks(8)
  let tickIndex = 0
  for (const index in props.dates) {
    const date = DateTime.fromJSDate(props.dates[index])
    if (
      tickIndex < ticks.length &&
      date.toMillis() >= ticks[tickIndex].getTime()
    ) {
      tickIndex++
      dayMarks[Number(index)] = date.toJSDate().toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
    }
  }
  return dayMarks
})

const tickValues = computed(() =>
  Object.keys(markLabels.value).map((index) => Number(index)),
)

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
    ? props.dates[dateIndex.value].toLocaleString()
    : '',
)

function getDateLabel(modelValue: number | string | undefined): string {
  const index =
    typeof modelValue === 'number' ? Math.round(modelValue) : dateIndex.value
  return props.dates[index]?.toLocaleString() ?? ''
}

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

function onSliderMouseEnter(): void {
  hideLabel.value = false
  isHovering.value = true
}

function onSliderMouseLeave(): void {
  hideLabel.value = true
  isHovering.value = false
}

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
  const now = props.now ?? new Date(Date.now())
  dateIndex.value = findDateIndex(props.dates, now)
}

function onSliderInput(value: number): void {
  dateIndex.value = Math.min(Math.max(Math.round(value), 0), maxIndex.value)
  stopFollowNow()
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

onUnmounted(() => {
  stopFollowTimer()
})
</script>

<style scoped>
.slider-container {
  margin: -8px 0px;
  padding: 0px 5px;
}

.datetime-slider__actions {
  display: flex;
  flex-direction: row;
  height: 32px;
  padding: 0px 10px 6px;
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

.datetime-slider__track :deep(.v-slider-track__tick-label) {
  position: absolute;
  top: -40px;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.datetime-slider__track--hover :deep(.v-slider-track__tick-label) {
  opacity: 1;
}

.datetime-slider__below-track {
  margin-top: -18px;
  margin-right: 8px;
  margin-left: 8px;
  margin-bottom: 8px;
}

.datetime-slider__tick-label {
  color: white;
  font-size: 0.75rem;
  white-space: nowrap;
}

.datetime-slider__thumb-label {
  white-space: nowrap;
}
</style>
