<template>
  <v-card
    border
    flat
    density="compact"
    @click="onExpansionPanelToggle"
    :ripple="false"
  >
    <div class="d-flex h-100 w-100">
      <div class="threshold-border vh-100 flex-0-0" />
      <v-card-text class="border-s py-2 h-100 w-100">
        <div class="d-flex w-100">
          <div class="d-flex ga-1 w-100">
            <div
              :class="{ 'text-truncate': !expanded }"
              class="overflow-hidden mt-2"
            >
              {{ maxLocationName }}
            </div>
            <v-chip
              v-if="crossings.length > 1"
              size="small"
              density="compact"
              label
              :text="crossings.length"
              class="flex-0-0 mt-2 ms-1"
            />
            <v-spacer />
            <div class="flex-0-0">
              <div :class="{ 'text-wrap': expanded }" class="text-right">
                {{ maxCrossing.maxValue }} {{ maxParameterUnit }}
              </div>
              <v-list-item-subtitle
                :class="{ 'text-wrap': expanded, 'text-wrap-no': !expanded }"
              >
                {{ maxTimeString }}
              </v-list-item-subtitle>
            </div>
          </div>
        </div>
      </v-card-text>
    </div>
  </v-card>
  <ThresholdsParameter
    v-if="expanded"
    v-for="crossing in crossings"
    :key="crossing.parameterId"
    :crossing="crossing"
    class="py-1"
  />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import ThresholdsParameter from '@/components/thresholds/ThresholdsParameter.vue'
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { toShortHumanReadableDate } from '@/lib/date'
import { useParametersStore } from '@/stores/parameters'
import { useLocationNamesStore } from '@/stores/locationNames'

interface Props {
  crossings: LevelThresholdCrossings[]
}
const props = defineProps<Props>()

const parameterStore = useParametersStore()
const locationNamesStore = useLocationNamesStore()

const maxCrossing = computed(() => props.crossings[0])
const maxColor = computed(() => maxCrossing.value.color)
const maxParameter = computed(() =>
  parameterStore.byId(maxCrossing.value.parameterId),
)
const maxParameterUnit = computed(() => maxParameter.value?.unit)

const maxTimeString = computed(() =>
  toShortHumanReadableDate(maxCrossing.value.maxValueTime),
)
const maxLocationName = computed(
  () =>
    locationNamesStore.byId(maxCrossing.value.locationId) ??
    maxCrossing.value.locationId,
)

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

function onExpansionPanelToggle() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}
</script>

<style scoped>
.text-wrap {
  white-space: normal;
}

.threshold-border {
  background-color: v-bind(maxColor);
  width: 7px;
}
</style>
