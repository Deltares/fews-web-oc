<template>
  <mgl-map
    ref="map"
    :interactive="true"
    :trackResize="true"
    :drag-pan="true"
    :scroll-zoom="true"
    :transform-request="transformRequest"
    :mapStyle="initialStyle"
    :doubleClickZoom="false"
    :pitchWithRotate="false"
    :dragRotate="false"
    :touchPitch="false"
    :attributionControl="false"
    :bounds="bounds"
    :fadeDuration="100"
  >
    <SyncMap />
    <!-- Fade duration is set to 100ms instead of 0ms to avoid flickering -->
    <mgl-attribution-control position="top-right" :compact="true" />
    <mgl-scale-control v-if="showScaleControl" position="bottom-right" />
    <slot></slot>
  </mgl-map>
</template>

<script setup lang="ts">
import SyncMap from '@/components/map/SyncMap.vue'
import {
  MglAttributionControl,
  MglMap,
  MglScaleControl,
} from '@indoorequal/vue-maplibre-gl'
import { ResourceType, RequestParameters, LngLatBounds, Map } from 'maplibre-gl'
import { useTemplateRef, watch } from 'vue'
import { transformStyle } from '@/lib/map'
import { getRequestHeaders } from '@/lib/requests/transformRequest'

interface Props {
  bounds?: LngLatBounds
  style: string
  showScaleControl?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showScaleControl: true,
})

const mapRef = useTemplateRef('map')

const initialStyle = props.style

watch(
  () => props.style,
  (newBaseStyle) => {
    if (!newBaseStyle) return

    // @ts-expect-error map is not exposed in the types
    const map: Map | undefined = mapRef.value?.map
    map?.setStyle(newBaseStyle, { transformStyle })
  },
)

function transformRequest(
  url: string,
  resourceType?: ResourceType,
): RequestParameters {
  if (resourceType === 'Image' && url.indexOf('GetMap') > -1) {
    const requestAuthHeaders = getRequestHeaders()
    return {
      url,
      headers: requestAuthHeaders,
    }
  }
  return {
    url,
  }
}
</script>
