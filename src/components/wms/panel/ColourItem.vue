<template>
  <v-list-item :title="item.style.title" density="compact">
    <div class="d-flex align-center ga-1">
      <ColourStrip
        v-if="item.useGradients !== false"
        :colourMap="item.colourMap"
        :useGradients="item.useGradients"
        class="my-2"
      />
      <ColourLegendTable
        v-else
        class="mt-1"
        :colourMap="item.colourMap"
        horizontal
        hideLabels
        style="max-width: 250px"
      />
    </div>
    <template #append>
      <slot name="append" />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import ColourStrip from '@/components/wms/ColourStrip.vue'
import ColourLegendTable from '@/components/wms/ColourLegendTable.vue'
import type { ColourScale } from '@/stores/colourScales'

interface Props {
  selected?: boolean
  item: ColourScale
}
defineProps<Props>()
</script>
