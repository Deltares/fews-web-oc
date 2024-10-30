<template>
  <ControlChip class="outer-chip justify-center overflow-visible">
    <v-icon class="pr-2">mdi-selection-drag</v-icon>
    <DrawBoundingBoxControl v-if="isActive" v-model="boundingBox" />

    <span class="mr-4 text-medium-emphasis" width="400px">
      {{ boundingBoxString }}
    </span>
    <v-btn
      :disabled="boundingBox === null"
      @click="onFinish"
      density="compact"
      color="primary"
      class="px-0 text-medium-emphasis"
    >
      Apply
    </v-btn>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BoundingBox, boundingBoxToString } from '@/services/useBoundingBox'
import DrawBoundingBoxControl from '@/components/map/DrawBoundingBoxControl.vue'
import ControlChip from '@/components/wms/ControlChip.vue'

const boundingBox = defineModel<BoundingBox | null>('boundingBox', {
  default: null,
})
const isActive = defineModel<boolean>('active', { default: false })

const emit = defineEmits(['finish'])

const boundingBoxString = computed(() =>
  boundingBox.value ? boundingBoxToString(boundingBox.value) : '—',
)

function onFinish(): void {
  isActive.value = false
  emit('finish')
}
</script>
