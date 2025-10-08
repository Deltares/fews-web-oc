<template>
  <v-card
    :border="true"
    :color="isSelected ? 'var(--selected-color)' : 'transparent'"
    flat
    density="compact"
    :ripple="false"
    v-bind="selectable ? { onClick: () => onPanelClick() } : {}"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <template v-for="(crossing, index) in crossings">
      <ThresholdsParameter
        v-if="index === 0 || isSelected"
        :key="crossing.parameterId"
        :crossing="crossing"
        :time-is-relative="relativeFormat"
      >
        <template #append v-if="crossings.length > 1 && !isSelected">
          <v-chip
            size="small"
            density="compact"
            variant="flat"
            :text="crossings.length"
            color="#00BBF0"
          />
        </template>
      </ThresholdsParameter>
    </template>
  </v-card>
</template>
<script setup lang="ts">
import ThresholdsParameter from '@/components/thresholds/ThresholdsField.vue'
import { NavigateRoute } from '@/lib/router/types'
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { ref } from 'vue'

interface Props {
  crossings: LevelThresholdCrossings[]
  isSelected?: boolean
  selectable?: boolean
}

const {
  crossings,
  isSelected = false,
  selectable = false,
} = defineProps<Props>()
const relativeFormat = ref(false)

interface Emits {
  navigate: [to: NavigateRoute]
}
const emit = defineEmits<Emits>()

function onMouseEnter() {
  relativeFormat.value = true
}

function onMouseLeave() {
  relativeFormat.value = false
}

function onPanelClick() {
  // Route to open the crossing in the map
  const to = {
    name: 'SpatialTimeSeriesDisplay',
    params: {
      locationIds: crossings[0].locationId,
    },
  }
  emit('navigate', to)
}
</script>
