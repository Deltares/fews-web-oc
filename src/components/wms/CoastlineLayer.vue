<template>
  <div>
    <MapboxLayer
      v-if="showCoastlineLayer"
      id="coastline_layer2"
      :source="coastlineLayerSource"
      :options="coastlineLayerOptions2"
      clickable
    />
    <MapboxLayer
      v-if="showCoastlineLayer"
      id="coastline_layer1"
      :source="coastlineLayerSource"
      :options="coastlineLayerOptions"
      clickable
    />
    <v-chip
      class="chip"
      :style="{ backgroundColor: backgroundColor }"
      pill
      label
    >
      <v-icon>mdi-earth-box</v-icon>
      <v-switch
        class="ml-2 mt-5"
        color="primary"
        :model-value="showCoastlineLayer"
        @update:model-value="onshowCoastlineLayerChange"
      />
    </v-chip>
  </div>
</template>

<script setup lang="ts">
import { Ref, ref, watchEffect } from 'vue'
import { MapboxLayer, useMap } from '@studiometa/vue-mapbox-gl'
import { Map } from 'mapbox-gl'

const backgroundColor = ref<string>(
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'rgba(0,0,0,.5)'
    : 'rgba(255,255,255,.5)',
)

const { map } = useMap() as { map: Ref<Map> }

const showCoastlineLayer = ref<boolean>(false)
const coastlineLayerSource = 'coastline_source'

function createCoastline() {
  const mapObject = map.value
  // if there is no source called coastline_source, create it
  if (mapObject.getSource(coastlineLayerSource) === undefined) {
    mapObject.addSource(coastlineLayerSource, {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    })
  }
}
const coastlineLayerOptions = {
  type: 'line',
  source: coastlineLayerSource,
  'source-layer': 'water',
  paint: {
    'line-color': '#000000',
    'line-width': 1,
  },
}
const coastlineLayerOptions2 = {
  type: 'line',
  source: coastlineLayerSource,
  'source-layer': 'water',
  paint: {
    'line-color': '#fff',
    'line-width': 3,
  },
}

watchEffect(async () => {
  if (showCoastlineLayer.value) {
    createCoastline()
  }
})

function onshowCoastlineLayerChange(): void {
  showCoastlineLayer.value = !showCoastlineLayer.value
}
</script>

<style scoped>
.chip {
  backdrop-filter: blur(4px);
  position: absolute;
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  top: 50px;
  left: 10px;
}
</style>
