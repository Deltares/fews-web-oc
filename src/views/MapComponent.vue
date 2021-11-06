<template>
  <div class="map-container">
    <v-mapbox
      :access-token="accessToken"
      map-style='https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      :center="[54, 25]"
      :zoom="5"
      :pitch="0"
      :bearing="0"
      :min-zoom="2"
      :interactive="true"
      :drag-pan="true"
      :scroll-zoom="true"
      class="map"
      ref="map"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Map } from 'mapbox-gl'

@Component
export default class MapComponent extends Vue {
  accessToken = process.env.VUE_APP_MAPBOX_TOKEN
  mounted (): void {
    const map: Map = (this.$refs.map as any).map
    map.on('load', () => {
      map.addSource('adoos', {
        type: 'raster',
        // use the tiles option to specify a WMS tile source URL
        // https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/
        tiles: [
          'https://rwsos-dataservices-ont.avi.deltares.nl/adoos/FewsWebServices/wms?service=WMS&request=GetMap&version=1.3&layers=AGM_Currents_FM&styles=Class.Wind.Speed&format=image%2Fpng&transparent=true&crs=EPSG:3857&showContours=false&time=2021-11-05T22%3A00%3A00.000Z&uppercase=false&bbox={bbox-epsg-3857}&height=512&width=512'
        ],
        tileSize: 512
      })
      map.addLayer(
        {
          id: 'wms-test-layer',
          type: 'raster',
          source: 'adoos',
          paint: {}
        }
      )
    })
  }
}
</script>

<style scoped>
.map-container {
  height: 100%;
}

.map {
  height: 100%;
  width: 100%;
}
</style>
