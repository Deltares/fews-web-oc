<template>
  <div class="datetime-slider">
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
import { computed, ref, watch } from 'vue'
import { scaleTime } from 'd3-scale'
import { DateTime } from 'luxon'

import { onMounted } from 'vue'
import { findDateIndex } from '@/lib/utils/findDateIndex'

import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

interface Properties {
  selectedDate?: Date
  dates: Date[]
  isLoading?: boolean
  doFollowNow?: boolean
  playInterval?: number
  followNowInterval?: number
}

const props = withDefaults(defineProps<Properties>(), {
  isLoading: false,
  doFollowNow: true,
  playInterval: 1000,
  followNowInterval: 60000,
})
const emit = defineEmits(['update:selectedDate', 'update:doFollowNow'])

// Step size when playing an animation, and when clicking the previous and next frame buttons.
const playIncrement = 1
const stepIncrement = 1
const dateIndex = ref(0)

const isPlaying = ref(false)
let playIntervalTimer: ReturnType<typeof setInterval> | null = null

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
        props.selectedDate?.getTime() !== props.dates[dateIndex.value].getTime()
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
  isPlaying.value ? 'mdi-pause' : 'mdi-play',
)
const nowButtonColor = computed(() =>
  doFollowNow.value ? 'orange' : undefined,
)
const playButtonColor = computed(() => (isPlaying.value ? 'orange' : undefined))

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
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startPlay()
  } else {
    stopPlay()
  }
}

function startPlay(): void {
  isPlaying.value = true
  stopFollowNow()
  playIntervalTimer = setInterval(play, props.playInterval)
}

function stopPlay(): void {
  isPlaying.value = false
  if (playIntervalTimer) {
    clearInterval(playIntervalTimer)
    playIntervalTimer = null
  }
}

function play(): void {
  if (dateIndex.value === maxIndex.value) {
    dateIndex.value = 0
  }
  increment(playIncrement)
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
  width: 24ch;
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
