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
    :renderWorldCopies="true"
    :min-zoom="minZoom"
    @map:resize="updateMinZoom"
  >
    <SyncMap />
    <!-- Fade duration is set to 100ms instead of 0ms to avoid flickering -->
    <mgl-attribution-control position="top-right" :compact="true" />
    <mgl-navigation-control
      v-if="showNavigation && showNavigationSetting"
      position="top-right"
    />
    <mgl-geolocate-control
      v-if="showGeolocation && showGeolocationSetting"
      position="top-right"
    />
    <mgl-scale-control v-if="showScale" position="bottom-right" />
    <slot></slot>
  </mgl-map>
</template>

<script setup lang="ts">
import { configManager } from '@/services/application-config'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import SyncMap from '@/components/map/SyncMap.vue'
import {
  MglAttributionControl,
  MglGeolocateControl,
  MglMap,
  MglNavigationControl,
  MglScaleControl,
} from '@indoorequal/vue-maplibre-gl'
import { ResourceType, RequestParameters, LngLatBounds, Map } from 'maplibre-gl'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useUserSettingsStore } from '@/stores/userSettings'

interface Props {
  bounds?: LngLatBounds
  style: string
  showGeolocation?: boolean
  showNavigation?: boolean
  showScale?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showGeolocation: true,
  showNavigation: true,
  showScale: true,
})

const mapRef = useTemplateRef('map')
const userSettings = useUserSettingsStore()

const minZoom = ref(0)

const initialStyle = props.style

onMounted(() => {
  updateMinZoom()
})

watch(
  () => props.style,
  (newBaseStyle) => {
    if (!newBaseStyle) return

    // @ts-expect-error map is not exposed in the types
    const map: Map | undefined = mapRef.value?.map
    map?.setStyle(newBaseStyle, { diff: true })
  },
)

const showGeolocationSetting = computed(
  () => userSettings.get('ui.map.geolocationControl')?.value ?? false,
)
const showNavigationSetting = computed(
  () => userSettings.get('ui.map.navigationControl')?.value ?? false,
)

function updateMinZoom() {
  // @ts-expect-error map is not exposed in the types
  const map: Map | undefined = mapRef.value?.map
  if (!map) return

  // Set minZoom based on the world width, with a base zoom level of 0 at a width of 512 pixels
  const worldSizeAtZoom0 = 512 // default tile size
  const worldWidth = map.getContainer().clientWidth
  minZoom.value = Math.log2(worldWidth / worldSizeAtZoom0)
}

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
