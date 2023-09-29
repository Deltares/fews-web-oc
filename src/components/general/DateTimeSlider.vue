<template>
  <div class="slider-container">
    <vue-slider
      v-model="dateIndex"
      :max="maxIndex"
      step="1"
      hide-details
      :dot-size="15"
      :tooltip-formatter="() => dateString"
      @change="stopFollowNow"
    />
  </div>
  <div class="controls-container">
    <slot name="prepend"></slot>
    <div class="now-tracking-control">
      <v-btn density="compact" variant="flat" icon @click="toggleFollowNow">
        <v-icon :color="nowButtonColor">{{ nowButtonIcon }}</v-icon>
      </v-btn>
      <span class="text-body-2 selected-date">{{ dateString }}</span>
    </div>
    <v-spacer />
    <div class="play-controls">
      <v-btn
        density="compact"
        variant="flat"
        icon="mdi-skip-previous"
        @mousedown="stepBackward"
        @mouseup="stopPlay"
      />
      <v-btn
        density="compact"
        variant="flat"
        icon
        @click="togglePlay"
      >
        <v-icon :color="playButtonColor">{{ playButtonIcon }}</v-icon>
      </v-btn>
      <v-btn
        density="compact"
        variant="flat"
        icon="mdi-skip-next"
        @mousedown="stepForward"
        @mouseup="stopPlay"
      />
    </div>
    <slot name="append"></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VueSlider from 'vue-slider-component'
import { useTimeoutFn } from '@vueuse/core'

/* import theme style */
interface Properties {
  selectedDate: Date
  dates: Date[]
  isLoading?: boolean
  doFollowNow?: boolean
  playInterval?: number
  followNowInterval?: number
}

const props = withDefaults(defineProps<Properties>(), {
  isLoading: false,
  doFollowNow: false,
  playInterval: 1000,
  followNowInterval: 10000,
})
const emit = defineEmits(['update:selectedDate', 'update:doFollowNow'])

// Step size when playing an animation, and when clicking the previous and next frame buttons.
const playIncrement = 1
const stepIncrement = 1
const dateIndex = ref(0)

const isPlaying = ref(false)
let playIntervalTimer: ReturnType<typeof setInterval> | null = null

const doFollowNow = ref(props.doFollowNow)
// let followNowIntervalTimer: ReturnType<typeof setInterval> | null = null

const { start, stop } = useTimeoutFn(() => {
  setDateToNow()
}, props.followNowInterval)

// Synchronise selectedDate property and local index variable.
watch(dateIndex, (index) => emit('update:selectedDate', props.dates[index]))
watch(
  () => props.selectedDate,
  (selectedDate) => {
    dateIndex.value = findIndexForDate(selectedDate)
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
  (_, oldDates) => {
    const oldDate = oldDates[dateIndex.value]
    dateIndex.value = findIndexForDate(oldDate)
  },
)

const maxIndex = computed(() => Math.max(props.dates.length - 1, 0))

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
  start()
}

function stopFollowNow(): void {
  doFollowNow.value = false
  stop()
}

function setDateToNow(): void {
  const now = new Date()
  dateIndex.value = findIndexForDate(now)
}

function findIndexForDate(date: Date): number {
  const index = props.dates.findIndex((current) => current >= date)
  if (index === -1) {
    // No time was found that was larger than the current time, so use the last date.
    return maxIndex.value
  } else {
    return index
  }
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
  increment(playIncrement)
  if (dateIndex.value === maxIndex.value) {
    stopPlay()
  }
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

<style lang="scss">
$themeColor: #6100ee;
@import 'vue-slider-component/lib/theme/antd.scss';
</style>

<style>
.slider-container {
  padding: 0px 10px;
}

.controls-container {
  display: flex;
  flex-direction: row;
  padding: 0 16px 10px;
}

.selected-date {
  margin: auto;
  width: 30ch;
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
</style>
