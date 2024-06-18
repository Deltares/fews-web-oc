<template>
  <div class="loading-overlay" :style="style">
    <v-icon size="x-large">mdi-loading mdi-spin</v-icon>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  margin?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

const props = defineProps<Props>()

const style = computed(() => ({
  paddingTop: props.margin?.top ? `${props.margin.top}px` : undefined,
  paddingRight: props.margin?.right ? `${props.margin.right}px` : undefined,
  paddingBottom: props.margin?.bottom ? `${props.margin.bottom}px` : undefined,
  paddingLeft: props.margin?.left ? `${props.margin.left}px` : undefined,
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
