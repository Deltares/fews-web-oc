<template>
  <ControlChip class="outer-chip justify-center overflow-visible">
    <v-icon start>mdi-selection-drag</v-icon>
    <DrawBoundingBoxControl v-if="isActive" v-model="boundingBox" />

    <span class="text-medium-emphasis">
      {{ boundingBoxString }}
    </span>

    <v-btn
      :disabled="boundingBox === null"
      @click="onFinish"
      density="compact"
      icon="mdi-close"
      class="ms-2"
    />
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
