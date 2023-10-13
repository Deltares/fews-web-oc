<template>
  <mapbox-map
    style="width: 100%; height: 100%"
    :access-token="accessToken"
    map-style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    :pitch="0"
    :bearing="0"
    :min-zoom="2"
    :interactive="true"
    :drag-pan="true"
    :scroll-zoom="true"
    :transformRequest="transformRequest"
  >
    <slot></slot>
  </mapbox-map>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { MapboxMap } from '@studiometa/vue-mapbox-gl'
import { configManager } from '../../services/application-config'
import type { ResourceType } from 'mapbox-gl'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'

const accessToken = ref('')

onBeforeMount(() => {
  accessToken.value = configManager.get('VITE_MAPBOX_TOKEN')
})

function transformRequest(url: string, resourceType: ResourceType) {
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
