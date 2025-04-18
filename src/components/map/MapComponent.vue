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
    <mgl-scale-control position="bottom-right" />
    <slot></slot>
  </mgl-map>
</template>

<script setup lang="ts">
import { configManager } from '@/services/application-config'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import SyncMap from '@/components/map/SyncMap.vue'
import {
  MglAttributionControl,
  MglMap,
  MglScaleControl,
} from '@indoorequal/vue-maplibre-gl'
import type {
  ResourceType,
  RequestParameters,
  LngLatBounds,
  Map,
} from 'maplibre-gl'
import { computed, useTemplateRef, watch } from 'vue'
import { transformStyle } from '@/lib/map'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { useBaseMapsStore } from '@/stores/baseMaps'

interface Props {
  bounds?: LngLatBounds
  baseMapId: string
}

const props = defineProps<Props>()

const mapRef = useTemplateRef('map')

const baseMapsStore = useBaseMapsStore()

const selectedStyle = computed(() => {
  const baseMap = baseMapsStore.getBaseMapById(props.baseMapId)

  const style = baseMap.style
  if (!style.startsWith('http')) {
    return getResourcesStaticUrl(style)
  }

  return style
})
const initialStyle = selectedStyle.value

watch(selectedStyle, (newBaseStyle) => {
  if (!newBaseStyle) return

  // @ts-expect-error map is not exposed in the types
  const map: Map | undefined = mapRef.value?.map
  map?.setStyle(newBaseStyle, { transformStyle })
})

function transformRequest(
  url: string,
  resourceType?: ResourceType,
): RequestParameters {
  if (!configManager.authenticationIsEnabled)
    return {
      url,
    }
  if (resourceType === 'Image' && url.indexOf('GetMap') > -1) {
    const requestAuthHeaders = authenticationManager.getAuthorizationHeaders()
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
