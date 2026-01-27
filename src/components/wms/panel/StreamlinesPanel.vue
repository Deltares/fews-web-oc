<template>
  <v-list-item prepend-icon="mdi-animation-play">
    <v-list-item-title>Animate</v-list-item-title>
    <template v-slot:append>
      <v-switch
        v-model="doAnimateStreamlines"
        color="primary"
        density="compact"
        hide-details
      ></v-switch>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { LayerKind } from '@/lib/streamlines'
import { computed } from 'vue'

const layerKind = defineModel<LayerKind>('layerKind', { required: true })

const doAnimateStreamlines = computed<boolean>({
  get: () => layerKind.value === LayerKind.Streamline,
  set: (doAnimate) => {
    layerKind.value = doAnimate ? LayerKind.Streamline : LayerKind.Static
  },
})
</script>
