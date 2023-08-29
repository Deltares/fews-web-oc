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
  >
    <slot></slot>
  </mapbox-map>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { MapboxMap } from '@studiometa/vue-mapbox-gl'
import { configManager } from '../../services/application-config'

const accessToken = ref('')

onBeforeMount(() => {
  accessToken.value = configManager.get('VITE_MAPBOX_TOKEN')
})
</script>
