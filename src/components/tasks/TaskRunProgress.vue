<template>
  <v-tooltip location="bottom">
    <template #activator="{ props: activatorProps }">
      <v-progress-linear
        v-bind="activatorProps"
        v-model="progress"
        :color="color"
        :indeterminate="isUnknownProgress"
      />
    </template>
    {{ details }}
  </v-tooltip>
</template>
<script setup lang="ts">
import { useFocusAwareInterval } from '@/services/useFocusAwareInterval'
import { Duration, DurationUnit } from 'luxon'
import { ref } from 'vue'

interface Props {
  dispatchTimestamp: number | null
  expectedRuntimeSeconds: number | null
  color?: string
  updateIntervalSeconds?: number
}
const props = withDefaults(defineProps<Props>(), {
  updateIntervalSeconds: 0.5,
})

const progress = ref(0)
const isUnknownProgress = ref(false)
const details = ref('')

useFocusAwareInterval(updateProgress, () => props.updateIntervalSeconds, {
  immediate: true,
})

function updateProgress(): void {
  if (
    props.dispatchTimestamp === null ||
    props.expectedRuntimeSeconds === null
  ) {
    // If we do not know how long to take, set progress to unknown to show
    // progress bar as indeterminate.
    setProgress(null)
    return
  }

  const currentTimestamp = Date.now()
  const currentDurationSeconds =
    (currentTimestamp - props.dispatchTimestamp) / 1000
  // Compute expected fraction done.
  const fractionDone = currentDurationSeconds / props.expectedRuntimeSeconds

  // If we are over 100%, set progress to 100% and do not show the
  // progress anymore.
  setProgress(fractionDone <= 1 ? fractionDone * 100 : 100)
}

function setProgress(newProgress: number | null): void {
  isUnknownProgress.value = newProgress === null
  progress.value = newProgress ?? 0
  details.value = getProgressDetails()
}

function getProgressDetails(): string {
  if (isUnknownProgress.value) {
    return getRemainingTimeString()
  }
  const percentage = progress.value.toFixed(0)
  const remaining = getRemainingTimeString()
  return `${percentage}%; ${remaining}`
}

function getRemainingTimeString(): string {
  const currentTimestamp = Date.now()
  if (
    props.dispatchTimestamp === null ||
    props.expectedRuntimeSeconds === null
  ) {
    return 'No expected runtime'
  }
  const currentDurationMilliseconds = currentTimestamp - props.dispatchTimestamp
  const remainingMilliseconds =
    props.expectedRuntimeSeconds * 1000 - currentDurationMilliseconds

  const hasOverrunExpectedTime = remainingMilliseconds < 0
  if (hasOverrunExpectedTime) {
    // We have overrun our expected task duration, negate the remaining time and
    // format this as the amount of time we've overrun.
    const remaining = formatDuration(-remainingMilliseconds)
    return `Overran expected time by: ${remaining}`
  } else {
    const remaining = formatDuration(remainingMilliseconds)
    return `Expected time remaining: ${remaining}`
  }
}

function formatDuration(durationMilliseconds: number): string {
  // Convert to human-readable duration in hours, minutes and seconds; drop
  // the milliseconds.
  // FIXME: workaround for Luxon's weird behaviour of toHuman(), which leaves
  //        units that are 0 in the final string.
  const units: DurationUnit[] = ['seconds']
  if (durationMilliseconds > 1000 * 60) {
    units.push('minutes')
  }
  if (durationMilliseconds > 1000 * 60 * 60) {
    units.push('hours')
  }
  if (durationMilliseconds > 1000 * 60 * 60 * 24) {
    units.push('days')
  }

  const duration = Duration.fromMillis(durationMilliseconds).shiftTo(...units)
  // Remove milliseconds.
  const durationWithoutMilliseconds = duration.set({
    seconds: Math.round(duration.seconds),
  })
  return durationWithoutMilliseconds.toHuman()
}
</script>
