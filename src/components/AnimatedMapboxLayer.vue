<template>
  <div />
</template>

<script lang="ts">
import { Component, Inject, Prop, Vue, Watch } from 'vue-property-decorator'
import { Map, RasterLayer, RasterSource } from 'mapbox-gl'

function getFrameId (layerName: string, frame: number): string {
  return `${layerName}-${frame}`
}

interface MapboxLayerOptions {
  name: string;
  time: Date;
}

@Component
export default class AnimatedMapboxLayer extends Vue {
  @Prop({ default: () => { return null } })
    layer!: MapboxLayerOptions | null

  @Inject() getMap!: () => Map

  mapObject!: Map
  newLayerId!: string
  initialRenderDone = false
  counter = 0
  currentLayer: string = ''

  deferredMountedTo(map: Map) {
    this.mapObject  = map
    this.mapObject.once('load', () => {
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
    if (!this.initialRenderDone || this.layer === null ) return
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
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    if (source === undefined) {
      const rasterSource: RasterSource = {
        type: 'raster',
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

