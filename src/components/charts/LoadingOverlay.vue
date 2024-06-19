<template>
  <div class="loading-overlay" :style="style">
    <v-skeleton-loader type="image" class="w-100 h-100" />
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
  height?: string
  width?: string
}

const props = defineProps<Props>()

const style = computed(() => ({
  paddingTop: props.offsets?.top ? `${props.offsets.top - 32}px` : undefined,
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

:deep(.v-skeleton-loader__image) {
  height: v-bind(height);
  width: v-bind(width);
  border-radius: 4px;
}
</style>
