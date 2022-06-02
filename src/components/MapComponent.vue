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
    >
    </v-mapbox>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Map } from 'mapbox-gl'

@Component
export default class MapComponent extends Vue {
  @Prop({ default: {} })
  layer!: any

  mapObject!: Map
  accessToken = process.env.VUE_APP_MAPBOX_TOKEN
  newLayerId!: string
  oldLayerId!: string
  initialRenderDone = false

  mounted (): void {
    this.mapObject = (this.$refs.map as any).map
    this.mapObject.once('load', (e) => {
      this.initialRenderDone = true
      this.onLayerChange()
    })
    this.mapObject.on('data', async (e) => {
      if (e.sourceId === this.newLayerId && e.tile !== undefined && e.isSourceLoaded) {
        this.removeOldLayers()
        this.mapObject.setPaintProperty(
          this.newLayerId,
          'raster-opacity',
          1
        )
        this.oldLayerId = this.newLayerId
      }
    })
  }

  @Watch('layer')
  onLayerChange (): void {
    if (!this.initialRenderDone) return
    if (this.layer.name === undefined || this.layer.time === undefined) {
      return
    }
    const time = this.layer.time.toISOString()
    const layerId = `${this.layer.name}-${time}`
    this.newLayerId = layerId
    const source = this.mapObject.getSource(layerId)
    if (source === undefined) {
      this.mapObject.addSource(layerId, {
        type: 'raster',
        // use the tiles option to specify a WMS tile source URL
        // https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/
        tiles: [
          `https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/wms?service=WMS&request=GetMap&version=1.3&layers=${this.layer.name}&crs=EPSG:3857&bbox={bbox-epsg-3857}&height=512&width=512&time=${time}`
        ],
        tileSize: 512
      })
      this.mapObject.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: layerId,
          paint: {
            'raster-opacity': 1,
            'raster-opacity-transition': {
              duration: 0,
              delay: 0
            },
            'raster-fade-duration': 0,
          }
        },
        'boundary_country_outline'
      )
    }
  }

  removeOldLayers (): void {
    if (this.oldLayerId !== this.newLayerId && this.mapObject.getSource(this.oldLayerId)) {
      this.mapObject.removeLayer(this.oldLayerId)
      this.mapObject.removeSource(this.oldLayerId)
      this.oldLayerId = ''
    }
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
