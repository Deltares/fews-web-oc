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
  >
    <mgl-attribution-control position="top-right" :compact="true" />
    <mgl-scale-control position="bottom-right" />
    <slot></slot>
  </mgl-map>
</template>

<script setup lang="ts">
import { configManager } from '@/services/application-config'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import {
  MglAttributionControl,
  MglDefaults,
  MglMap,
  MglScaleControl,
  useMap,
} from '@indoorequal/vue-maplibre-gl'
import type { ResourceType, RequestParameters, LngLatBounds } from 'maplibre-gl'
import { useBaseLayers } from '@/services/useBaseLayers'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useTemplateRef, watch } from 'vue'
import { transformStyle } from '@/lib/map'

interface Props {
  bounds?: LngLatBounds
}

defineProps<Props>()

const settings = useUserSettingsStore()

MglDefaults.style =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const { baseLayerStyle } = useBaseLayers(
  () => settings.get('ui.map.theme')?.value as string | undefined,
)

const initialStyle = baseLayerStyle.value

const mapRef = useTemplateRef('map')

watch(baseLayerStyle, (newBaseStyle) => {
  if (!newBaseStyle) return

  // NOTE: We have to get mapkey because useMap uses inject and we are not a child of MglMap
  const mapKey = mapRef.value?.mapKey
  const map = useMap(mapKey).map
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
