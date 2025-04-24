<template>
  <v-card
    :border="true"
    flat
    density="compact"
    :ripple="false"
    @click="onExpansionPanelToggle"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <template v-for="(crossing, index) in crossings">
      <ThresholdsParameter
        v-if="index === 0 || expanded"
        :key="crossing.parameterId"
        :crossing="crossing"
        :time-is-relative="relativeFormat"
      >
        <template #append v-if="crossings.length > 1 && !expanded">
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
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { ref } from 'vue'

interface Props {
  crossings: LevelThresholdCrossings[]
}

defineProps<Props>()
const relativeFormat = ref(false)

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

function onMouseEnter() {
  relativeFormat.value = true
}

function onMouseLeave() {
  relativeFormat.value = false
}

function onExpansionPanelToggle() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}
</script>
