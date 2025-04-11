<template>
  <div class="table-container border-t">
    <v-list-item class="parameter-item pa-1 ps-2 w-100">
      <div class="d-flex pb-1">
        <v-list-item-title>
          {{ parameterName }}
        </v-list-item-title>
        <v-spacer />
        <v-list-item-title class="ps-1 flex-0-0">
          {{ crossing.maxValue }} {{ parameterUnit }}
        </v-list-item-title>
      </div>
      <div class="d-flex">
        <v-list-item-subtitle class="">
          {{ crossing.warningLevelName }}
        </v-list-item-subtitle>
        <v-spacer />
        <v-list-item-subtitle class="flex-0-0">
          {{ timeToMaxString }}
        </v-list-item-subtitle>
      </div>
    </v-list-item>
  </div>
</template>

<script setup lang="ts">
import { toDateAbsDifferenceString } from '@/lib/date'
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'
import { useParametersStore } from '@/stores/parameters'

interface Props {
  crossing: Omit<LevelThresholdCrossings, 'locationId'>
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

const crossingColor = computed(() => {
  return props.crossing.color
})

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
.table-container {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

.parameter-item {
  border-right: 5px solid v-bind(crossingColor);
}
</style>
