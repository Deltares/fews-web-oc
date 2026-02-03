<template>
  <div class="datetime-slider" aria-labelledby="date time slider">
    <div class="slider-container">
      <vue-slider
        v-model="dateIndex"
        :marks="marks"
        :hide-label="hideLabel"
        step="1"
        :tooltipFormatter="dateString"
        silent
        :max="maxIndex"
        @change="stopFollowNow"
      >
        <template v-slot:step="{ active, style, activeStyle }">
          <div
            :class="[
              'vue-slider-mark-step',
              { 'vue-slider-mark-step-active': active },
            ]"
            :style="active ? activeStyle : style"
            @mouseover="hideLabel = false"
            @mouseleave="hideLabel = true"
          ></div>
        </template>
        <template v-slot:label="{ label }">
          <span
            :class="[
              'vue-slider-mark-label',
              'vue-slider-dot-tooltip-inner',
              'custom-label',
            ]"
            >{{ label }}</span
          >
        </template>
      </vue-slider>
      <slot name="below-track"></slot>
    </div>
    <div class="datetime-slider__actions">
      <slot name="prepend"></slot>
      <div class="now-tracking-control">
        <v-btn
          density="compact"
          variant="text"
          :icon="nowButtonIcon"
          :color="nowButtonColor"
          @click="toggleFollowNow"
        />
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
import { computed, onMounted, ref, watch, type WatchHandle } from 'vue'
import { scaleTime } from 'd3-scale'
import { DateTime } from 'luxon'

import { findDateIndex } from '@/lib/utils/dates'

import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

interface Properties {
  selectedDate?: Date
  dates: Date[]
  isLoading?: boolean
  doFollowNow?: boolean
  playInterval?: number
  followNowInterval?: number
  hideSpeedControls?: boolean
}

const props = withDefaults(defineProps<Properties>(), {
  isLoading: false,
  doFollowNow: true,
  playInterval: 1000,
  followNowInterval: 60000,
  hideSpeedControls: false,
})
const emit = defineEmits(['update:selectedDate', 'update:doFollowNow'])

// Step size when playing an animation, and when clicking the previous and next frame buttons.
const playIncrement = 1
const stepIncrement = 1
const dateIndex = ref(0)

const defaultSpeed = 1
const currentSpeed = ref(defaultSpeed)
const availableSpeeds = [0.5, 1, 2, 4]

const playTimeoutTimer = ref<ReturnType<typeof setTimeout>>()

const doFollowNow = ref(props.doFollowNow)
let followNowIntervalTimer: ReturnType<typeof setInterval> | null = null

const hideLabel = ref(true)

onMounted(() => {
  if (props.doFollowNow) {
    startFollowNow()
  }
})

const marks = computed(() => {
  const dayMarks: Record<string, any> = {}
  const dateScale = scaleTime().domain(props.dates)
  const ticks = dateScale.ticks(5)
  let tickIndex = 0
  let now = DateTime.now()
  const remainder = 10 - (now.minute % 10)
  now = now.plus({ minutes: remainder }).startOf('minute')
  for (const index in props.dates) {
    const date = DateTime.fromJSDate(props.dates[index])
    if (
      tickIndex < ticks.length &&
      date.toMillis() >= ticks[tickIndex].getTime()
    ) {
      tickIndex++
      dayMarks[index] = {
        label: date.toJSDate().toLocaleString(undefined, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }),
      }
    }
  }
  return dayMarks
})

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

// Synchronise doFollowNow property and local variable.
watch(doFollowNow, (doFollowNow) => {
  emit('update:doFollowNow', doFollowNow)
})

watch(
  () => props.doFollowNow,
  (doFollowNowProp) => {
    doFollowNow.value = doFollowNowProp
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
    } else {
      if (props.selectedDate) {
        const oldDate = props.selectedDate
        dateIndex.value = findDateIndex(props.dates, oldDate)
      }
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
const nowButtonIcon = computed(() =>
  props.isLoading ? 'mdi-loading mdi-spin' : 'mdi-clock',
)
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

function toggleFollowNow(): void {
  doFollowNow.value = !doFollowNow.value
  if (doFollowNow.value) {
    startFollowNow()
  } else {
    stopFollowNow()
  }
}

function startFollowNow(): void {
  doFollowNow.value = true
  stopPlay()
  setDateToNow()
  followNowIntervalTimer = setInterval(setDateToNow, props.followNowInterval)
}

function stopFollowNow(): void {
  doFollowNow.value = false
  if (followNowIntervalTimer) clearInterval(followNowIntervalTimer)
  followNowIntervalTimer = null
}

function setDateToNow(): void {
  const now = new Date()
  dateIndex.value = findDateIndex(props.dates, now)
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
</script>

<style scoped>
.slider-container {
  padding: 0px 10px;
}

.datetime-slider__actions {
  display: flex;
  flex-direction: row;
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

.vue-slider-mark-label.custom-label {
  position: absolute;
  top: -25px;
  transform: translate(-50%, -100%);
}
</style>
