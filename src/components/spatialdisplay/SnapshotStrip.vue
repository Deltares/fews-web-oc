<template>
  <div class="datetime-slider__snapshot-strip mb-1" style="margin-top: -7px">
    <div class="datetime-slider__snapshot-times-wrapper">
      <div class="datetime-slider__snapshot-center-line"></div>
      <div
        ref="snapshotViewport"
        class="datetime-slider__snapshot-times"
        :class="{ 'is-dragging': snapshotIsDragging }"
        @scroll="onSnapshotScroll"
        @wheel="onSnapshotWheel"
        @click="onSnapshotStripClick"
        @pointerdown="onSnapshotPointerDown"
        @pointermove="onSnapshotPointerMove"
        @pointerup="onSnapshotPointerUp"
        @pointercancel="onSnapshotPointerUp"
      >
        <div
          class="datetime-slider__snapshot-spacer"
          :style="{ width: `${snapshotLeftPadding}px` }"
        ></div>
        <div
          v-for="frame in visibleSnapshotFrames"
          :key="frame.time.toISOString()"
          class="datetime-slider__snapshot-frame"
          :class="{
            'datetime-slider__snapshot-frame--selected':
              frame.index === selectedSnapshotIndex,
            'datetime-slider__snapshot-frame--empty': !frame.hasImage,
          }"
        >
          <template v-if="frame.hasImage">
            <img
              class="datetime-slider__snapshot-image"
              :src="frame.url"
              :alt="`Snapshot at ${formatSnapshotTime(frame.time)}`"
              loading="lazy"
              draggable="false"
            />
            <div
              v-if="frame.hasTimeMismatch"
              class="datetime-slider__snapshot-image-mismatch-overlay"
              aria-hidden="true"
            ></div>
          </template>
          <div
            v-if="!frame.hasImage"
            class="datetime-slider__snapshot-image datetime-slider__snapshot-image--empty"
            aria-hidden="true"
          ></div>
          <span
            class="datetime-slider__snapshot-label"
            :class="{
              'datetime-slider__snapshot-label--day-transition':
                frame.isDayTransition && frame.time.getHours() !== 0,
            }"
          >
            <span
              v-if="frame.isDayTransition && frame.time.getHours() !== 0"
              class="datetime-slider__snapshot-label-date"
              >{{ formatSnapshotDay(frame.time) }}</span
            >
            <span>{{ formatSnapshotChip(frame.time) }}</span>
          </span>
        </div>
        <div
          class="datetime-slider__snapshot-spacer"
          :style="{ width: `${snapshotRightPadding}px` }"
        ></div>
      </div>
    </div>
    <v-btn
      class="datetime-slider__snapshot-close"
      size="x-small"
      variant="text"
      density="compact"
      icon="mdi-close"
      aria-label="Close snapshots"
      @click.stop="emit('close')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { LngLatBounds } from 'maplibre-gl'
import type { AnimatedRasterLayerOptions } from '@/components/wms/AnimatedRasterLayer.vue'
import { clamp } from '@/lib/utils/math'
import { toMercator } from '@turf/projection'
import { point } from '@turf/helpers'
import { timeFormat } from 'd3-time-format'
import { configManager } from '@/services/application-config'

interface Props {
  times?: Date[]
  selectedDate?: Date
  layerOptions?: AnimatedRasterLayerOptions
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedDate', date: Date): void
  (e: 'close'): void
}>()

const snapshotViewport = ref<HTMLElement>()
const snapshotScrollLeft = ref(0)
const snapshotViewportWidth = ref(0)
const snapshotIntervalIndex = ref(0)
const animateNextSnapshotCentering = ref(false)
const snapshotIsDragging = ref(false)
let snapshotDragStartClientX = 0
let snapshotDragStartScrollLeft = 0
let snapshotDragDistance = 0
let snapshotWheelRemainderPx = 0
const SNAPSHOT_DRAG_CLICK_THRESHOLD_PX = 4
let snapshotResizeObserver: ResizeObserver | undefined

const SNAPSHOT_FRAME_WIDTH = 96
const SNAPSHOT_FRAME_GAP = 0
const SNAPSHOT_FRAME_STRIDE = SNAPSHOT_FRAME_WIDTH + SNAPSHOT_FRAME_GAP
const SNAPSHOT_OVERSCAN = 6
const WHEEL_DELTA_LINE_PX = 16
const MS_PER_MINUTE = 60 * 1000
const SNAPSHOT_INTERVAL_MINUTES_OPTIONS = [
  1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440,
]

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const layerTimeStepMs = computed(() => {
  const times = props.times
  if (!times || times.length < 2) {
    return SNAPSHOT_INTERVAL_MINUTES_OPTIONS[0] * MS_PER_MINUTE
  }

  const sortedTimes = times
    .map((time) => time.getTime())
    .sort((left, right) => left - right)

  let smallestStepMs = Number.POSITIVE_INFINITY
  for (let index = 1; index < sortedTimes.length; index += 1) {
    const stepMs = sortedTimes[index] - sortedTimes[index - 1]
    if (stepMs > 0 && stepMs < smallestStepMs) {
      smallestStepMs = stepMs
    }
  }

  if (!Number.isFinite(smallestStepMs)) {
    return SNAPSHOT_INTERVAL_MINUTES_OPTIONS[0] * MS_PER_MINUTE
  }

  return smallestStepMs
})

const snapshotIntervalOptionsMs = computed(() => {
  const optionsMs = SNAPSHOT_INTERVAL_MINUTES_OPTIONS.map(
    (minutes) => minutes * MS_PER_MINUTE,
  ).filter((intervalMs) => intervalMs >= layerTimeStepMs.value)

  if (optionsMs.length === 0) {
    return [layerTimeStepMs.value]
  }

  return optionsMs
})

const snapshotIntervalMs = computed(
  () =>
    snapshotIntervalOptionsMs.value[snapshotIntervalIndex.value] ??
    snapshotIntervalOptionsMs.value[0],
)

const snapshotTimelineTimes = computed(() => {
  const times = props.times
  if (!times?.length) return []

  const rangeStart = times[0]
  const rangeEnd = times.at(-1)
  if (!rangeEnd) return []

  const dayStartMs = new Date(rangeStart).setHours(0, 0, 0, 0)
  const firstLayerOffsetMs = rangeStart.getTime() - dayStartMs
  const alignsWithDayStart = firstLayerOffsetMs % snapshotIntervalMs.value === 0
  const originMs = alignsWithDayStart ? dayStartMs : rangeStart.getTime()

  const alignedStart = getAlignedTimeOnOrBefore(
    rangeStart,
    snapshotIntervalMs.value,
    originMs,
  )
  const alignedEnd = getAlignedTimeOnOrBefore(
    rangeEnd,
    snapshotIntervalMs.value,
    originMs,
  )
  const timeline: Date[] = []

  for (
    let currentTimeMs = alignedStart.getTime();
    currentTimeMs <= alignedEnd.getTime();
    currentTimeMs += snapshotIntervalMs.value
  ) {
    timeline.push(new Date(currentTimeMs))
  }

  return timeline
})

const selectedSnapshotIndex = computed(() => {
  if (!snapshotTimelineTimes.value.length || !props.selectedDate) {
    return -1
  }

  const timelineStartMs = snapshotTimelineTimes.value[0].getTime()
  const relativeIntervals =
    (props.selectedDate.getTime() - timelineStartMs) / snapshotIntervalMs.value

  return clamp(
    Math.floor(relativeIntervals),
    0,
    Math.max(snapshotTimelineTimes.value.length - 1, 0),
  )
})

const visibleSnapshotRange = computed(() => {
  const total = snapshotTimelineTimes.value.length
  if (!total) return { start: 0, end: 0 }

  const scrollWithoutEdgePadding = Math.max(
    snapshotScrollLeft.value - snapshotEdgePadding.value,
    0,
  )
  const firstVisibleIndex = Math.floor(
    scrollWithoutEdgePadding / SNAPSHOT_FRAME_STRIDE,
  )
  const visibleCount = Math.ceil(
    snapshotViewportWidth.value / SNAPSHOT_FRAME_STRIDE,
  )

  const start = Math.max(firstVisibleIndex - SNAPSHOT_OVERSCAN, 0)
  const end = Math.min(start + visibleCount + SNAPSHOT_OVERSCAN * 2, total)
  return { start, end }
})

const snapshotEdgePadding = computed(() =>
  Math.max(snapshotViewportWidth.value / 2, 0),
)

const snapshotLeftPadding = computed(
  () =>
    snapshotEdgePadding.value +
    visibleSnapshotRange.value.start * SNAPSHOT_FRAME_STRIDE,
)

const snapshotRightPadding = computed(() => {
  const total = snapshotTimelineTimes.value.length
  return Math.max(
    0,
    snapshotEdgePadding.value +
      (total - visibleSnapshotRange.value.end) * SNAPSHOT_FRAME_STRIDE,
  )
})

const snapshotFrames = computed(() => {
  if (!props.layerOptions?.bbox) return []

  const snapshotBbox = getMercatorBboxFromBounds(props.layerOptions.bbox)
  const availableTimes = props.times ?? []
  const availableStartTime = props.times?.[0]
  const availableEndTime = props.times?.at(-1)
  const availableTimeMsSet = new Set(
    availableTimes.map((time) => time.getTime()),
  )

  return snapshotTimelineTimes.value.map((time, timelineIndex) => {
    const prevTime =
      timelineIndex > 0
        ? snapshotTimelineTimes.value[timelineIndex - 1]
        : undefined
    const isDayTransition =
      prevTime === undefined ||
      prevTime.getDate() !== time.getDate() ||
      prevTime.getMonth() !== time.getMonth() ||
      prevTime.getFullYear() !== time.getFullYear()

    const isInAvailableRange =
      availableStartTime !== undefined &&
      availableEndTime !== undefined &&
      time.getTime() >= availableStartTime.getTime() &&
      time.getTime() <= availableEndTime.getTime()

    const isLeadingFallbackFrame =
      timelineIndex === 0 &&
      availableStartTime !== undefined &&
      time.getTime() < availableStartTime.getTime()

    const hasImage = isInAvailableRange || isLeadingFallbackFrame
    const requestTime = isLeadingFallbackFrame ? availableStartTime : time
    const hasTimeMismatch = hasImage && !availableTimeMsSet.has(time.getTime())

    return {
      index: timelineIndex,
      time,
      isDayTransition,
      hasImage,
      hasTimeMismatch,
      url: hasImage ? buildSnapshotGetMapUrl(requestTime, snapshotBbox) : '',
    }
  })
})

const allSnapshotFramesFitInViewport = computed(() => {
  if (snapshotViewportWidth.value <= 0) return false
  const totalFramesWidth =
    snapshotTimelineTimes.value.length * SNAPSHOT_FRAME_STRIDE
  return totalFramesWidth <= snapshotViewportWidth.value
})

const visibleSnapshotFrames = computed(() =>
  snapshotFrames.value.slice(
    visibleSnapshotRange.value.start,
    visibleSnapshotRange.value.end,
  ),
)

const layerStepPx = computed(() =>
  Math.max(
    (layerTimeStepMs.value / snapshotIntervalMs.value) * SNAPSHOT_FRAME_STRIDE,
    1,
  ),
)

const maxSelectableLayerStep = computed(() => {
  const timelineStart = snapshotTimelineTimes.value[0]
  const availableEndTime = props.times?.at(-1)
  if (!timelineStart || !availableEndTime) return 0

  return Math.max(
    0,
    Math.floor(
      (availableEndTime.getTime() - timelineStart.getTime()) /
        layerTimeStepMs.value,
    ),
  )
})

const formatSnapshotMillisecond = timeFormat('.%L')
const formatSnapshotSecond = timeFormat(':%S')
const formatSnapshotMinute = timeFormat('%H:%M')
const formatSnapshotHour = timeFormat('%H:%M')
const formatSnapshotDay = timeFormat('%d %b')
const formatSnapshotMonth = timeFormat('%b')
const formatSnapshotYear = timeFormat('%Y')

function formatSnapshotTime(time: Date): string {
  return time.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSnapshotChip(time: Date): string {
  if (time.getMilliseconds()) return formatSnapshotMillisecond(time)
  if (time.getSeconds()) return formatSnapshotSecond(time)
  if (time.getMinutes()) return formatSnapshotMinute(time)
  if (time.getHours()) return formatSnapshotHour(time)
  if (time.getDate() !== 1) return formatSnapshotDay(time)
  if (time.getMonth() !== 0) return formatSnapshotMonth(time)
  return formatSnapshotYear(time)
}

function onSnapshotScroll(): void {
  if (!snapshotViewport.value) return
  snapshotScrollLeft.value = snapshotViewport.value.scrollLeft
}

function onSnapshotWheel(event: WheelEvent): void {
  const viewport = snapshotViewport.value
  if (!viewport) return

  if (!event.shiftKey) {
    const wheelDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY
    if (wheelDelta === 0) return

    const deltaPx = getWheelDeltaPx(event, wheelDelta, viewport.clientWidth)
    // Keep scrolling aligned with real layer timesteps.
    snapshotWheelRemainderPx += deltaPx
    const layerSteps = Math.trunc(snapshotWheelRemainderPx / layerStepPx.value)
    if (layerSteps === 0) return

    event.preventDefault()
    const maxSelectableScrollLeft = getMaxSelectableScrollLeft(viewport)
    const currentLayerStepIndex = Math.round(
      viewport.scrollLeft / layerStepPx.value,
    )
    const maxLayerStepIndex = Math.floor(
      maxSelectableScrollLeft / layerStepPx.value,
    )
    const nextLayerStepIndex = clamp(
      currentLayerStepIndex + layerSteps,
      0,
      maxLayerStepIndex,
    )
    const nextScrollLeft = nextLayerStepIndex * layerStepPx.value
    viewport.scrollLeft = nextScrollLeft
    snapshotWheelRemainderPx -= layerSteps * layerStepPx.value
    return
  }

  snapshotWheelRemainderPx = 0

  if (event.deltaY === 0) return
  event.preventDefault()

  // If all frames are already visible, do not allow further zooming out.
  if (event.deltaY > 0 && allSnapshotFramesFitInViewport.value) return

  const maxIntervalIndex = snapshotIntervalOptionsMs.value.length - 1

  if (event.deltaY > 0) {
    snapshotIntervalIndex.value = Math.min(
      snapshotIntervalIndex.value + 1,
      maxIntervalIndex,
    )
  } else {
    snapshotIntervalIndex.value = Math.max(snapshotIntervalIndex.value - 1, 0)
  }
}

function getWheelDeltaPx(
  event: WheelEvent,
  delta: number,
  viewportWidthPx: number,
): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return delta * WHEEL_DELTA_LINE_PX
  }
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return delta * viewportWidthPx
  }
  return delta
}

watch(snapshotIntervalOptionsMs, (options) => {
  if (options.length === 0) {
    snapshotIntervalIndex.value = 0
    return
  }

  const currentInterval = options[snapshotIntervalIndex.value]
  if (currentInterval !== undefined) return

  snapshotIntervalIndex.value = options.length - 1
})

function onSnapshotStripClick(event: MouseEvent): void {
  if (snapshotDragDistance > SNAPSHOT_DRAG_CLICK_THRESHOLD_PX) return
  const viewport = snapshotViewport.value
  const timelineTimes = snapshotTimelineTimes.value
  const availableTimes = props.times
  if (!viewport || !timelineTimes.length || !availableTimes?.length) return

  const viewportRect = viewport.getBoundingClientRect()
  const clickOffsetPx =
    event.clientX -
    viewportRect.left +
    viewport.scrollLeft -
    snapshotEdgePadding.value
  const layerStepIndex = clamp(
    Math.round(clickOffsetPx / layerStepPx.value),
    0,
    maxSelectableLayerStep.value,
  )
  const timelineStart = timelineTimes[0]
  if (!timelineStart) return
  const clickedTime = new Date(
    timelineStart.getTime() + layerStepIndex * layerTimeStepMs.value,
  )
  const closestSliderTime = getClosestTime(clickedTime, availableTimes)
  if (!closestSliderTime) return

  animateNextSnapshotCentering.value = true
  emit('update:selectedDate', closestSliderTime)
}

function onSnapshotPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return
  const viewport = snapshotViewport.value
  if (!viewport) return

  snapshotIsDragging.value = true
  snapshotDragStartClientX = event.clientX
  snapshotDragStartScrollLeft = viewport.scrollLeft
  snapshotDragDistance = 0
  viewport.setPointerCapture(event.pointerId)
}

function onSnapshotPointerMove(event: PointerEvent): void {
  if (!snapshotIsDragging.value) return
  const viewport = snapshotViewport.value
  if (!viewport) return

  const delta = snapshotDragStartClientX - event.clientX
  snapshotDragDistance = Math.abs(delta)
  viewport.scrollLeft = clamp(
    snapshotDragStartScrollLeft + delta,
    0,
    getMaxSelectableScrollLeft(viewport),
  )
}

function onSnapshotPointerUp(event: PointerEvent): void {
  if (!snapshotIsDragging.value) return
  snapshotIsDragging.value = false
  snapshotViewport.value?.releasePointerCapture(event.pointerId)

  if (snapshotDragDistance <= SNAPSHOT_DRAG_CLICK_THRESHOLD_PX) return

  const viewport = snapshotViewport.value
  const timelineTimes = snapshotTimelineTimes.value
  const availableTimes = props.times
  if (!viewport || !timelineTimes.length || !availableTimes?.length) return

  // The center line sits at scrollLeft + viewportWidth/2, and the edge padding
  // equals viewportWidth/2, so the frame index under the center line is simply
  // scrollLeft / SNAPSHOT_FRAME_STRIDE.
  const layerStepIndex = clamp(
    Math.round(viewport.scrollLeft / layerStepPx.value),
    0,
    maxSelectableLayerStep.value,
  )
  const timelineStart = timelineTimes[0]
  if (!timelineStart) return
  const centeredTime = new Date(
    timelineStart.getTime() + layerStepIndex * layerTimeStepMs.value,
  )
  const closestSliderTime = getClosestTime(centeredTime, availableTimes)
  if (!closestSliderTime) return

  emit('update:selectedDate', closestSliderTime)
}

function getClosestTime(targetTime: Date, times: Date[]): Date | undefined {
  if (!times.length) return undefined

  let closestTime = times[0]
  let smallestDistance = Math.abs(closestTime.getTime() - targetTime.getTime())

  for (let index = 1; index < times.length; index += 1) {
    const candidateTime = times[index]
    const distance = Math.abs(candidateTime.getTime() - targetTime.getTime())
    if (distance < smallestDistance) {
      smallestDistance = distance
      closestTime = candidateTime
    }
  }

  return closestTime
}

function getAlignedTimeOnOrBefore(
  date: Date,
  intervalMs: number,
  originMs?: number,
): Date {
  const refMs = originMs ?? new Date(date).setHours(0, 0, 0, 0)
  const elapsedMs = date.getTime() - refMs
  const steps = Math.floor(elapsedMs / intervalMs)
  return new Date(refMs + steps * intervalMs)
}

function getMaxSelectableScrollLeft(viewport: HTMLElement): number {
  const maxCenteredScrollLeft = maxSelectableLayerStep.value * layerStepPx.value
  const maxContentScrollLeft = Math.max(
    viewport.scrollWidth - viewport.clientWidth,
    0,
  )
  return Math.min(maxCenteredScrollLeft, maxContentScrollLeft)
}

function updateSnapshotViewportMetrics(): void {
  if (!snapshotViewport.value) return
  snapshotViewportWidth.value = snapshotViewport.value.clientWidth
  snapshotScrollLeft.value = snapshotViewport.value.scrollLeft
}

function centerSnapshotAroundSelectedTime(animate = false): void {
  if (!snapshotViewport.value) return
  if (!snapshotTimelineTimes.value.length || !props.selectedDate) return

  const timelineStartMs = snapshotTimelineTimes.value[0].getTime()
  const relativeIntervals =
    (props.selectedDate.getTime() - timelineStartMs) / snapshotIntervalMs.value
  const selectedFrameOffsetPx = relativeIntervals * SNAPSHOT_FRAME_STRIDE
  const targetCenter = snapshotEdgePadding.value + selectedFrameOffsetPx
  const desiredScrollLeft = Math.max(
    targetCenter - snapshotViewportWidth.value / 2,
    0,
  )
  const maxScrollLeft = Math.max(
    snapshotViewport.value.scrollWidth - snapshotViewport.value.clientWidth,
    0,
  )
  const nextScrollLeft = Math.min(desiredScrollLeft, maxScrollLeft)

  if (animate) {
    snapshotViewport.value.scrollTo({
      left: nextScrollLeft,
      behavior: 'smooth',
    })
    snapshotScrollLeft.value = nextScrollLeft
    return
  }

  snapshotViewport.value.scrollLeft = nextScrollLeft
  snapshotScrollLeft.value = snapshotViewport.value.scrollLeft
}

function buildSnapshotGetMapUrl(time: Date, bbox: number[]): string {
  const getMapUrl = new URL(`${baseUrl}/wms`)
  getMapUrl.searchParams.append('service', 'WMS')
  getMapUrl.searchParams.append('request', 'GetMap')
  getMapUrl.searchParams.append('version', '1.3')
  getMapUrl.searchParams.append('layers', props.layerOptions?.name ?? '')
  getMapUrl.searchParams.append('crs', 'EPSG:3857')
  getMapUrl.searchParams.append('bbox', `${bbox}`)
  getMapUrl.searchParams.append('height', '60')
  getMapUrl.searchParams.append('width', '96')
  getMapUrl.searchParams.append('time', time.toISOString())

  if (props.layerOptions?.aggregationLabel) {
    getMapUrl.searchParams.append(
      'aggregation',
      props.layerOptions.aggregationLabel,
    )
  }
  if (props.layerOptions?.useLastValue) {
    getMapUrl.searchParams.append('useLastValue', 'true')
  }
  if (props.layerOptions?.style) {
    getMapUrl.searchParams.append('styles', props.layerOptions.style)
  }
  if (props.layerOptions?.elevation) {
    getMapUrl.searchParams.append(
      'elevation',
      `${props.layerOptions.elevation}`,
    )
  }
  if (props.layerOptions?.layerType) {
    getMapUrl.searchParams.append('layerType', props.layerOptions.layerType)
  }
  if (props.layerOptions?.colorScaleRange) {
    getMapUrl.searchParams.append(
      'colorScaleRange',
      `${props.layerOptions.colorScaleRange}`,
    )
    getMapUrl.searchParams.append(
      'useDisplayUnits',
      props.layerOptions.useDisplayUnits ? 'true' : 'false',
    )
  }
  if (props.layerOptions?.taskRunId) {
    getMapUrl.searchParams.append('taskRunId', props.layerOptions.taskRunId)
  }

  return getMapUrl.toString()
}

function getMercatorBboxFromBounds(bounds: LngLatBounds): number[] {
  const sw = toMercator(point(bounds.getSouthWest().toArray()))
  const ne = toMercator(point(bounds.getNorthEast().toArray()))
  return [...sw.geometry.coordinates, ...ne.geometry.coordinates]
}

watch(
  () => props.selectedDate,
  async () => {
    await nextTick()
    updateSnapshotViewportMetrics()
    const animate = animateNextSnapshotCentering.value
    animateNextSnapshotCentering.value = false
    centerSnapshotAroundSelectedTime(animate)
  },
)

watch(
  () => snapshotIntervalIndex.value,
  async () => {
    await nextTick()
    updateSnapshotViewportMetrics()
    centerSnapshotAroundSelectedTime()
  },
)

onMounted(() => {
  snapshotResizeObserver = new ResizeObserver(() => {
    updateSnapshotViewportMetrics()
  })
  if (snapshotViewport.value) {
    snapshotResizeObserver.observe(snapshotViewport.value)
  }
  updateSnapshotViewportMetrics()
  centerSnapshotAroundSelectedTime()
})

onUnmounted(() => {
  snapshotResizeObserver?.disconnect()
  snapshotResizeObserver = undefined
})
</script>

<style scoped>
.datetime-slider__snapshot-strip {
  position: relative;
  display: flex;
  align-items: center;
  height: 72px;
  padding: 6px 6px;
}

.datetime-slider__snapshot-times-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
}

.datetime-slider__snapshot-times {
  display: flex;
  align-items: center;
  gap: 0;
  height: 100%;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
  cursor: grab;
  user-select: none;
}

.datetime-slider__snapshot-times.is-dragging {
  cursor: grabbing;
}

.datetime-slider__snapshot-times::-webkit-scrollbar {
  display: none;
}

.datetime-slider__snapshot-spacer {
  height: 1px;
  flex: 0 0 auto;
}

.datetime-slider__snapshot-center-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background-color: rgba(var(--v-theme-secondary), 0.9);
  pointer-events: none;
  z-index: 2;
}

.datetime-slider__snapshot-frame {
  position: relative;
  width: 96px;
  min-width: 96px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background-color: rgba(var(--v-theme-surface), 0.9);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
}

.datetime-slider__snapshot-frame--empty {
  border-color: rgba(var(--v-theme-on-surface), 0.3);
}

.datetime-slider__snapshot-frame--selected {
  border-color: rgba(var(--v-theme-secondary), 0.9);
}

.datetime-slider__snapshot-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.datetime-slider__snapshot-image-mismatch-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.4;
  background: repeating-linear-gradient(
    45deg,
    rgba(var(--v-theme-on-surface), 0.3),
    rgba(var(--v-theme-on-surface), 0.3) 8px,
    rgba(var(--v-theme-surface), 0.15) 8px,
    rgba(var(--v-theme-surface), 0.15) 16px
  );
}

.datetime-slider__snapshot-label {
  position: absolute;
  left: 4px;
  bottom: 4px;
  padding: 1px 5px;
  border-radius: 999px;
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.92);
  background-color: rgba(var(--v-theme-surface), 0.75);
}

.datetime-slider__snapshot-label--day-transition {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 4px;
  gap: 1px;
}

.datetime-slider__snapshot-label-date {
  font-size: 9px;
  opacity: 0.75;
  line-height: 1.2;
}

.datetime-slider__snapshot-close {
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  z-index: 3;
}
</style>
