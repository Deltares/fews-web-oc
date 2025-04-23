<template>
  <v-btn icon class="thresholds-button" :active="active">
    <v-badge :content="badgeCount">
      <v-icon icon="mdi-alert" :color="maxWarningLevelColor" />
    </v-badge>
  </v-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { WarningLevel } from '@/lib/thresholds'
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'

interface Props {
  warningLevels: WarningLevel[]
  crossings: LevelThresholdCrossings[]
  active: boolean
}

const props = defineProps<Props>()

const badgeCount = computed(() =>
  props.warningLevels.reduce((tot, lvl) => tot + lvl.count, 0),
)

const maxWarningLevelColor = computed(() => {
  const maxWarningLevel = props.warningLevels.find(
    (warningLevel) => warningLevel.count > 0,
  )
  const crossing = props.crossings.find(
    (crossing) => crossing.warningLevelId === maxWarningLevel?.id,
  )
  return crossing?.color
})
</script>

<style scoped>
.thresholds-button__img {
  position: absolute;
  top: 1px;
  left: 0px;
  height: 24px;
}

img.thresholds-button__img:nth-of-type(2) {
  top: -1px;
  left: 5px;
  height: 22px;
  z-index: -1;
}

img.thresholds-button__img:nth-of-type(3) {
  top: -2px;
  left: 6px;
  height: 20px;
  z-index: -2;
}
</style>
