<template>
  <VisualCompare
    :skeleton="false"
    :slideOnClick="false"
    :keyboard="true"
    class="ma-8"
  >
    <template #left>
      <mgl-map
        map-style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        :center="center"
        :zoom="zoom"
        width="100%"
        height="500px"
      >
        <SyncMap />
        <mgl-navigation-control />
      </mgl-map>
    </template>
    <template #right>
      <mgl-map
        map-style="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        :center="center"
        :zoom="zoom"
        width="100%"
        height="500px"
      >
        <SyncMap />
        <mgl-navigation-control />
      </mgl-map>
    </template>
  </VisualCompare>
</template>

<script setup lang="ts">
import VisualCompare from '@/components/compare/VisualCompare.vue'
import { MglMap, MglNavigationControl } from '@indoorequal/vue-maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import SyncMap from '@/components/map/SyncMap.vue'

import type { LngLatLike } from 'maplibre-gl'
import type { NavigateRoute } from '@/lib/router'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyId?: string
  nodeId?: string | string[]
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = defineProps<Props>()

interface Emits {
  navigate: [to: NavigateRoute]
}

const emit = defineEmits<Emits>()

// Durban coordinates
const center: LngLatLike = [31.0218, -29.8587]
const zoom = 8
</script>
