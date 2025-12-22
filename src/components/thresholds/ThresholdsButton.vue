<template>
  <v-btn icon size="small" :active="active" aria-label="Thresholds button">
    <v-avatar size="24" :rounded="false" v-if="maxWarningLevelColor">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path
          stroke="black"
          stroke-width="1"
          :fill="maxWarningLevelColor"
          d="M8.2679491924311 3.7727586640478a2 2 0 0 1 3.4641016151378 0l6.0358983848622 10.454482671904a2 2 0 0 1 -1.7320508075689 3l-12.071796769724 0a2 2 0 0 1 -1.7320508075689 -3z"
        />
        <text
          x="11"
          y="14"
          text-anchor="middle"
          fill="black"
          font-size="10"
          font-weight="bold"
          font-family="arial"
        >
          !
        </text>
      </svg>
    </v-avatar>
    <v-icon size="large" v-else icon="mdi-alert" />
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

const maxWarningLevelColor = computed(() => {
  const maxWarningLevel = props.warningLevels.find(
    (warningLevel) => warningLevel.count > 0,
  )
  const foundCrossing = props.crossings.find(
    (crossing) => crossing.warningLevelId === maxWarningLevel?.id,
  )
  return foundCrossing?.color
})
</script>
