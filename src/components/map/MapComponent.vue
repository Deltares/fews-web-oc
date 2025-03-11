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
} from '@indoorequal/vue-maplibre-gl'
import type {
  ResourceType,
  RequestParameters,
  LngLatBounds,
  Map,
} from 'maplibre-gl'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { transformStyle } from '@/lib/map'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { useBaseMapsStore } from '@/stores/baseMaps'

interface Props {
  bounds?: LngLatBounds
  baseMapId: string
}

const props = defineProps<Props>()

const mapRef = useTemplateRef('map')

MglDefaults.style =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

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

const authorizationHeaders = ref<Headers>()

onMounted(async () => {
  authorizationHeaders.value =
    await authenticationManager.getAuthorizationHeaders()
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
    const headers = authorizationHeaders.value
    return {
      url,
      headers,
    }
  }
  return {
    url,
  }
}
</script>
