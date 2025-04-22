<template>
  <v-btn icon class="thresholds-button">
    <v-badge :content="badgeCount">
      <v-icon>mdi-alert</v-icon>
      <template
        v-for="level in warningLevelsStore.warningLevels"
        :key="level.id"
      >
        <img
          v-if="level.icon && level.count"
          class="thresholds-button__img"
          :src="getResourcesIconsUrl(level.icon)"
          alt="Threshold Icon"
        />
      </template>
    </v-badge>
  </v-btn>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { getResourcesIconsUrl } from '@/lib/fews-config'
import { useWarningLevelsStore } from '@/stores/warningLevels'
import { onMounted } from 'vue'

const warningLevelsStore = useWarningLevelsStore()

onMounted(() => {
  console.log(warningLevelsStore.warningLevels)
})

watch(
  () => warningLevelsStore.warningLevels,
  () => {
    console.log(warningLevelsStore.warningLevels)
  },
)

const badgeCount = computed(() => {
  return warningLevelsStore.warningLevels.reduce((a, b) => {
    return a + b.count
  }, 0)
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
