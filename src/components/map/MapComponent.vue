<template>
  <mgl-map
    ref="map"
    :min-zoom="2"
    :interactive="true"
    :drag-pan="true"
    :scroll-zoom="true"
    :transform-request="transformRequest"
    :mapStyle="baseLayerStyle"
    :doubleClickZoom="false"
    :pitchWithRotate="false"
    :dragRotate="false"
    :touchZoomRotate="false"
    :touchPitch="false"
  >
    <mgl-scale-control position="top-right" />
    <slot></slot>
  </mgl-map>
</template>

<script setup lang="ts">
import { configManager } from '@/services/application-config'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import { MglMap, MglDefaults, MglScaleControl } from 'vue-maplibre-gl'
import { type ResourceType, type RequestParameters } from 'maplibre-gl'
import 'vue-maplibre-gl/dist/vue-maplibre-gl.css'
import { useBaseLayers } from '@/services/useBaseLayers'
import { useUserSettingsStore } from '@/stores/userSettings'

const settings = useUserSettingsStore()

MglDefaults.style =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const { baseLayerStyle } = useBaseLayers(
  () => settings.get('ui.map.theme')?.value as string | undefined,
)

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
