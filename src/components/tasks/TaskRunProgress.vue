<template>
  <v-tooltip location="bottom">
    <template #activator="{ props: activatorProps }">
      <v-progress-linear
        v-bind="activatorProps"
        v-model="progress"
        :color="isOverTime ? 'warning' : color"
        height="5"
      />
    </template>
    {{ details }}
  </v-tooltip>
</template>
<script setup lang="ts">
import { useFocusAwareInterval } from '@/services/useFocusAwareInterval'
import { Duration } from 'luxon'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  dispatchTimestamp: number | null
  expectedRuntimeSeconds: number | null
  color?: string
  updateIntervalSeconds?: number
}
const props = withDefaults(defineProps<Props>(), {
  updateIntervalSeconds: 0.5,
})

const { t, locale } = useI18n()
const progress = ref(0)
const isUnknownProgress = ref(false)
const isOverTime = ref(false)
const details = ref('')

onMounted(() => {
  updateProgress()
})

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
    isOverTime.value = false
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
  isOverTime.value = fractionDone > 1
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
    return t('taskDuration.noExpectedRuntime')
  }
  const currentDurationMilliseconds = currentTimestamp - props.dispatchTimestamp
  const remainingMilliseconds =
    props.expectedRuntimeSeconds * 1000 - currentDurationMilliseconds

  const hasOverrunExpectedTime = remainingMilliseconds < 0
  if (hasOverrunExpectedTime) {
    // We have overrun our expected task duration, negate the remaining time and
    // format this as the amount of time we've overrun.
    const remaining = formatDuration(-remainingMilliseconds)
    return `${t('taskDuration.overranExpectedTimeBy')}: ${remaining}`
  } else {
    const remaining = formatDuration(remainingMilliseconds)
    return `${t('taskDuration.expectedTimeRemaining')}: ${remaining}`
  }
}

function formatDuration(durationMilliseconds: number): string {
  const duration = Duration.fromMillis(durationMilliseconds, {
    locale: locale.value,
  })

  if (durationMilliseconds < 1000) {
    return duration.shiftTo('seconds').mapUnits(Math.floor).toHuman()
  }

  // Normalize and remove milliseconds
  const normalized = duration
    .shiftTo('days', 'hours', 'minutes', 'seconds')
    .mapUnits(Math.floor)

  return normalized.toHuman({ showZeros: false })
}
</script>
