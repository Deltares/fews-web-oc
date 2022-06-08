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
import { Map, RasterLayer, RasterSource } from 'mapbox-gl'

function getFrameId (layerName: string, frame: number): string {
  return `${layerName}-${frame}`
}

@Component
export default class MapComponent extends Vue {
  @Prop({ default: () => { return {} } })
  layer!: any

  mapObject!: Map
  accessToken = process.env.VUE_APP_MAPBOX_TOKEN
  newLayerId!: string
  initialRenderDone = false
  counter = 0
  currentLayer: string = ''

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
          e.sourceId,
          'raster-opacity',
          1
        )
      }
    })
  }

  @Watch('layer')
  onLayerChange (): void {
    if (!this.initialRenderDone) return
    if (this.layer.name === undefined || this.layer.time === undefined) {
      return
    }
    if (this.layer.name !== this.currentLayer) {
      this.counter += 1
      this.removeOldLayers()
      this.counter = 0
      this.currentLayer = this.layer.name
    }
    const time = this.layer.time.toISOString()
    this.counter += 1
    this.newLayerId = getFrameId(this.layer.name, this.counter)
    const source = this.mapObject.getSource(this.newLayerId)
    const baseUrl = this.$config.get<string>('VUE_APP_FEWS_WEBSERVICES_URL')
    if (source === undefined) {
      const rasterSource: RasterSource = {
        type: 'raster',
        // use the tiles option to specify a WMS tile source URL
        // https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/
        tiles: [
          `${baseUrl}/wms?service=WMS&request=GetMap&version=1.3&layers=${this.layer.name}&crs=EPSG:3857&bbox={bbox-epsg-3857}&height=512&width=512&time=${time}`
        ],
        tileSize: 512,
      }
      this.mapObject.addSource(this.newLayerId, rasterSource)
      const rasterLayer: RasterLayer = {
        id: this.newLayerId,
        type: 'raster',
        source: this.newLayerId,
        paint: {
          'raster-opacity': 0,
          'raster-opacity-transition': {
            duration: 0,
            delay: 0
          },
          'raster-fade-duration': 0,
        },
      }
      this.mapObject.addLayer(
        rasterLayer,
        'boundary_country_outline'
      )
    }
  }

  removeOldLayers (): void {
    for (let i = this.counter - 1; i > 0; i--) {
      const oldLayerId = getFrameId(this.currentLayer, i)
      if (this.mapObject.getLayer(oldLayerId)) {
        this.mapObject.removeLayer(oldLayerId)
        this.mapObject.removeSource(oldLayerId)
      } else {
        break
      }
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
