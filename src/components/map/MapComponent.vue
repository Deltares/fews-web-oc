<template>
  <mgl-map
    ref="map"
    :pitch="0"
    :bearing="0"
    :center="[0, 0]"
    :min-zoom="2"
    :interactive="true"
    :drag-pan="true"
    :scroll-zoom="true"
    :transform-request="transformRequest"
  >
    <slot></slot>
  </mgl-map>
</template>

<script setup lang="ts">
import { configManager } from '@/services/application-config'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import { MglMap, useMap, MglDefaults } from 'vue-maplibre-gl'
import { type ResourceType, type RequestParameters } from 'maplibre-gl'

import 'maplibre-gl/dist/maplibre-gl.css'
import 'vue-maplibre-gl/dist/vue-maplibre-gl.css'

MglDefaults.style =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const map = useMap()

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
