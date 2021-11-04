<template>
  <div id="map">
    <v-mapbox
      access-token="pk.eyJ1Ijoic2lnZ3lmIiwiYSI6Il8xOGdYdlEifQ.3-JZpqwUa3hydjAJFXIlMA"
      map-style='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
      :center="[5, 51]"
      :zoom="6"
      :pitch="0"
      :bearing="0"
      :min-zoom="5"
      :interactive="true"
      :drag-pan="true"
      :scroll-zoom="true"
      class="map"
      ref="map"
      id="map"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
// import mapboxgl from 'mapbox-gl'

@Component
export default class MapComponent extends Vue {
  mounted () {
    // var map = new mapboxgl.Map({
    //   container: 'map',
    //   center: [-74.50, 40],
    //   zoom: 9
    // })
    const map = (this.$refs.map as any).map
    console.log(map)
    // map.addLayer(
    //   {
    //     id: 'simple-tiles',
    //     type: 'raster',
    //     source: {
    //       type: 'raster',
    //       tiles: [
    //         'https://geodata.nationaalgeoregister.nl/tiles/service/wmts/brtachtergrondkaartwater/EPSG:3857/{z}/{x}/{y}.png'
    //       ],
    //       tileSize: 256
    //     },
    //     minzoom: 0,
    //     maxzoom: 22
    //   }
    // )
    // map.setStyle({
    //   version: 8,
    //   sources: {
    //     'raster-tiles': {
    //       type: 'raster',
    //       tiles: [
    //         'http://{s}.tiles.mapbox.com/v3/cartodb.map-208dddrd/{z}/{x}/{y}.png'
    //       ],
    //       tileSize: 256
    //     }
    //   },
    //   layers: [
    //     {
    //       id: 'simple-tiles',
    //       type: 'raster',
    //       source: 'raster-tiles',
    //       minzoom: 0,
    //       maxzoom: 22
    //     }
    //   ]
    // })
  }
}
</script>

<style scoped>
div#map {
  height: 100%;
  width: 100%;
}
</style>
