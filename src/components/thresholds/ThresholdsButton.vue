<template>
  <v-btn icon :active="active">
    <v-badge
      :content="badgeCount"
      :model-value="badgeCount > 0"
      color="#00BBF0"
    >
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
