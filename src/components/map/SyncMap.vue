<template></template>

<script setup lang="ts">
import { mapIds } from '@/lib/map/ids'
import { useMap } from '@/services/useMap'
import { useMapSync } from '@/services/useMapSync'
import type { GeoJSONSource } from 'maplibre-gl'
import { onUnmounted } from 'vue'

const { map } = useMap()

useMapSync(map)

if (import.meta.env.MODE === 'e2e' && map) {
  const locationMap: NonNullable<Window['__e2eLocationMap']> = {
    setZoom(zoom) {
      map.setZoom(zoom)
    },
    async hasLocation(id) {
      const source = map.getSource<GeoJSONSource>(mapIds.location.source)
      const data = await source?.getData()
      if (data?.type !== 'FeatureCollection') return undefined

      return data.features.some(
        ({ properties }) => properties?.locationId === id,
      )
    },
  }
  window.__e2eLocationMap = locationMap
  onUnmounted(() => {
    if (window.__e2eLocationMap === locationMap) {
      delete window.__e2eLocationMap
    }
  })
}
</script>
