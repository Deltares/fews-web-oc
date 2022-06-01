<template>
  <div class="map-container">
    <v-mapbox
      :access-token="accessToken"
      map-style='https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      :center="[5, 55]"
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
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Map } from 'mapbox-gl'
import DateTimeSlider from '@/components/DateTimeSlider.vue'

@Component({
  components: {
    DateTimeSlider,
  }
})
export default class MapComponent extends Vue {
  @Prop({ default: '' })
  layer!: string

  accessToken = process.env.VUE_APP_MAPBOX_TOKEN
  current = ''

  mounted (): void {
    const map: Map = (this.$refs.map as any).map
    map.on('load', () => {
      this.onLayerChange()
    })
  }

  @Watch('layer')
  onLayerChange (): void {
    const map: Map = (this.$refs.map as any).map
    if (map.getLayer(this.current)) {
      map.removeLayer(this.current)
    }
    if (map.getSource(this.current)) {
      map.removeSource(this.current)
    }
    map.addSource(`${this.layer}`, {
      type: 'raster',
      // use the tiles option to specify a WMS tile source URL
      // https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/
      tiles: [
        `https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/wms?service=WMS&request=GetMap&version=1.3&layers=${this.layer}&crs=EPSG:3857&bbox={bbox-epsg-3857}&height=512&width=512`
      ],
      tileSize: 512
    })
    map.addLayer(
      {
        id: `${this.layer}`,
        type: 'raster',
        source: `${this.layer}`,
        paint: {}
      },
      'aeroway-runway'
    )
    this.current = this.layer
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
