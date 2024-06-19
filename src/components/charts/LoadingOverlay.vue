<template>
  <div class="loading-overlay" :style="style">
    <v-icon size="x-large">mdi-loading mdi-spin</v-icon>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  offsets?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

const props = defineProps<Props>()

const style = computed(() => ({
  paddingTop: props.offsets?.top ? `${props.offsets.top}px` : undefined,
  paddingRight: props.offsets?.right ? `${props.offsets.right}px` : undefined,
  paddingBottom: props.offsets?.bottom
    ? `${props.offsets.bottom}px`
    : undefined,
  paddingLeft: props.offsets?.left ? `${props.offsets.left}px` : undefined,
}))
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
