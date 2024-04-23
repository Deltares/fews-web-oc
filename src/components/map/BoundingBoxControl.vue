<template>
  <DrawBoundingBoxControl v-if="isActive" v-model="boundingBox" />

  <span class="mx-4 text-medium-emphasis" width="400px">
    {{ boundingBoxString }}
  </span>
  <v-btn
    @click="onFinish"
    density="compact"
    variant="tonal"
    class="px-0 text-medium-emphasis"
  >
    Apply
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { BoundingBox, boundingBoxToString } from '@/services/useBoundingBox'

import DrawBoundingBoxControl from '@/components/map/DrawBoundingBoxControl.vue'

const boundingBox = defineModel<BoundingBox | null>('boundingBox', {
  default: null,
})
const isActive = defineModel<boolean>('active', { default: false })

const emit = defineEmits(['finish'])

const boundingBoxString = computed(() =>
  boundingBox.value ? boundingBoxToString(boundingBox.value) : '',
)

function onFinish(): void {
  isActive.value = false
  emit('finish')
}
</script>
