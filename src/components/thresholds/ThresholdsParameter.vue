<template>
  <div class="parameter-container d-flex align-center ps-1 pe-4">
    <div class="flex-0-0">
      <v-img :src="crossing.icon" width="20" height="20" />
    </div>
    <div class="w-100 ms-2">
      <div class="d-flex">
        <div>
          {{ parameterName }}
        </div>
        <v-spacer />
        <div class="ps-1 flex-0-0">
          {{ crossing.maxValue }} {{ parameterUnit }}
        </div>
      </div>
      <div class="d-flex">
        <v-list-item-subtitle>
          {{ crossing.warningLevelName }}
        </v-list-item-subtitle>
        <v-spacer />
        <v-list-item-subtitle class="flex-0-0">
          {{ timeToMaxString }}
        </v-list-item-subtitle>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toDateAbsDifferenceString } from '@/lib/date'
import type { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'
import { useParametersStore } from '@/stores/parameters'

interface Props {
  crossing: LevelThresholdCrossings
}

const props = defineProps<Props>()

const parameterStore = useParametersStore()

const NOW_REFRESH_INTERVAL = 1000
const now = useNow({ interval: NOW_REFRESH_INTERVAL })

const timeToMaxString = computed(() =>
  toDateAbsDifferenceString(now.value, props.crossing.maxValueTime, {
    excludeSeconds: true,
    relativeFormat: true,
  }),
)

const parameter = computed(() => {
  return parameterStore.byId(props.crossing.parameterId)
})

const parameterName = computed(
  () =>
    parameter.value?.shortName ??
    parameter.value?.name ??
    props.crossing.parameterId,
)

const parameterUnit = computed(() => {
  return parameter.value?.unit
})
</script>

<style scoped>
.parameter-container {
  font-size: 0.875rem;
}
</style>
