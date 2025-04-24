<template>
  <div class="threshold_field d-flex d-row w-100">
    <div class="threshold_field__border flex-0-0 vh-100" />
    <div class="d-flex flex-1-1 flex-row align-center ps-1 pe-4 mt-1 mb-2">
      <div class="ms-2 d-flex flex-0-0 flex-column">
        <span>
          {{ maxLocationName }}
        </span>
        <v-list-item-subtitle>
          {{ parameterName }}
        </v-list-item-subtitle>
      </div>
      <div class="ms-2 flex-column">
        <span class="d-inline"> <slot name="append"></slot> </span>
      </div>
      <v-spacer />
      <div
        class="threshold_field__value_date ms-2 d-flex flex-column align-end"
      >
        <span> {{ crossing.maxValue }} {{ parameterUnit }} </span>
        <v-list-item-subtitle>
          {{ timeToMaxString }}
        </v-list-item-subtitle>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toDateAbsDifferenceString, toShortHumanReadableDate } from '@/lib/date'
import type { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'
import { useParametersStore } from '@/stores/parameters'
import { useLocationNamesStore } from '@/stores/locationNames'

interface Props {
  crossing: LevelThresholdCrossings
  timeIsRelative?: boolean
}

const props = defineProps<Props>()

const parameterStore = useParametersStore()
const locationNamesStore = useLocationNamesStore()

const NOW_REFRESH_INTERVAL = 1000
const now = useNow({ interval: NOW_REFRESH_INTERVAL })

const maxColor = computed(() => props.crossing.color)

const timeToMaxString = computed(() => {
  if (props.timeIsRelative) {
    return toDateAbsDifferenceString(now.value, props.crossing.maxValueTime, {
      excludeSeconds: true,
      relativeFormat: true,
    })
  }
  return toShortHumanReadableDate(props.crossing.maxValueTime)
})

const parameter = computed(() => {
  return parameterStore.byId(props.crossing.parameterId)
})

const parameterName = computed(
  () =>
    parameter.value?.name ??
    parameter.value?.shortName ??
    props.crossing.parameterId,
)

const maxLocationName = computed(
  () =>
    locationNamesStore.byId(props.crossing.locationId) ??
    props.crossing.locationId,
)

const parameterUnit = computed(() => {
  return parameter.value?.unit
})
</script>

<style scoped>
.threshold_field__border {
  background-color: v-bind(maxColor);
  width: 7px;
}

.threshold_field__value_date {
  flex: 0 0 100px;
}

.threshold_field {
  font-size: 0.875rem;
}
</style>
