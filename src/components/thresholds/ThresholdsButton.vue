<template>
  <v-btn icon class="thresholds-button">
    <v-badge :content="badgeCount">
      <img
        v-for="level in filteredWarningLevels"
        :key="level.id"
        class="thresholds-button__img"
        :src="level.icon"
        alt="Threshold Icon"
      />
      <v-icon :icon="defaultIcon" />
    </v-badge>
  </v-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useWarningLevelsStore } from '@/stores/warningLevels'

const warningLevelsStore = useWarningLevelsStore()

const badgeCount = computed(() =>
  warningLevelsStore.warningLevels.reduce((tot, lvl) => tot + lvl.count, 0),
)

const filteredWarningLevels = computed(() =>
  warningLevelsStore.warningLevels.filter((level) => level.count && level.icon),
)

const defaultIcon = computed(() =>
  // Hide the default icon if there are icons to show
  filteredWarningLevels.value.length ? undefined : 'mdi-alert',
)
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
