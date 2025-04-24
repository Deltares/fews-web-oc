<template>
  <v-card
    border
    flat
    density="compact"
    @click="onExpansionPanelToggle"
    :ripple="false"
  >
    <template v-for="(crossing, index) in crossings"
    >
    <ThresholdsParameter
      v-if="index === 0 || expanded"
      :key="crossing.parameterId"
      :crossing="crossing"
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
import ThresholdsParameter from '@/components/thresholds/ThresholdsParameter.vue'
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'

interface Props {
  crossings: LevelThresholdCrossings[]
}

defineProps<Props>()

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
