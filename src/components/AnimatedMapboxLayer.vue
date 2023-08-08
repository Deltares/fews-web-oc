<template>
  <div />
</template>

<script lang="ts">
import { Component, Inject, Prop, Vue, Watch } from 'vue-property-decorator'
import { ImageSource, ImageSourceRaw, LngLatBounds, Map, RasterLayer } from 'mapbox-gl'
import { point } from "@turf/helpers"
import { toMercator } from "@turf/projection"

function getFrameId (layerName: string, frame: number): string {
  return `${layerName}-${frame}`
}

function getCoordsFromBounds(bounds: LngLatBounds) {
  return [
    bounds.getNorthWest().toArray(),
    bounds.getNorthEast().toArray(),
    bounds.getSouthEast().toArray(),
    bounds.getSouthWest().toArray(),
  ]
}

function isBoundsWithinBounds(innerBounds: LngLatBounds, outerBounds: LngLatBounds) {
  const innerNorthEast = innerBounds.getNorthEast();
  const innerSouthWest = innerBounds.getSouthWest();
  const outerNorthEast = outerBounds.getNorthEast();
  const outerSouthWest = outerBounds.getSouthWest();

  const isLngWithin = innerSouthWest.lng >= outerSouthWest.lng && innerNorthEast.lng <= outerNorthEast.lng;
  const isLatWithin = innerSouthWest.lat >= outerSouthWest.lat && innerNorthEast.lat <= outerNorthEast.lat;
  return isLngWithin && isLatWithin;
}

export interface MapboxLayerOptions {
  name: string;
  time: Date;
  bbox:number[];
}

function getMercatorBboxFromBounds(bounds: LngLatBounds): number[] {
  const sw = toMercator(point(bounds.getSouthWest().toArray()))
  const ne = toMercator(point(bounds.getNorthEast().toArray()))
  return [...sw.geometry.coordinates, ...ne.geometry.coordinates]
}

@Component
export default class AnimatedMapboxLayer extends Vue {
  @Prop({ default: () => { return null } })
  layer!: MapboxLayerOptions | null

  @Inject() getMap!: () => Map

  mapObject!: Map
  newLayerId!: string
  isInitialized = false
  counter = 0
  currentLayer: string = ''

  mounted() {
    const map = this.getMap();
    if(map && map.isStyleLoaded()) {
      this.mapObject = map
      this.isInitialized = true
      this.onLayerChange();
    }
  }

  deferredMountedTo(map: Map) {
    this.mapObject = map
    this.mapObject.once('load', () => {
      this.isInitialized = true
      this.onLayerChange()
    })
    this.mapObject.on('moveend', () => {
      this.updateSource()
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

  updateSource() {
    if (this.layer === null || this.newLayerId ) return
    const time = this.layer.time.toISOString()
    const source = this.mapObject.getSource(this.newLayerId) as ImageSource
    const bounds = this.mapObject.getBounds()
    const canvas = this.mapObject.getCanvas()
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    source.updateImage({
      url: `${baseUrl}/wms?service=WMS&request=GetMap&version=1.3&layers=${this.layer.name}&crs=EPSG:3857&bbox=${getMercatorBboxFromBounds(bounds)}&height=${canvas.height}&width=${canvas.width}&time=${time}`,
      coordinates: getCoordsFromBounds(bounds)
    })
  }

  setDefaultZoom() {
    if (this.layer === null || this.layer.bbox === undefined) return
    if (this.mapObject && this.layer.bbox.length === 4) {
      const bbox = this.layer.bbox
      const currentBounds = this.mapObject.getBounds()
      const bounds = new LngLatBounds(
        [bbox[0], bbox[1]], // sw
        [bbox[2], bbox[3]], // ne
      )
      if (isBoundsWithinBounds(currentBounds, bounds)) {
          return
        } else {
          this.mapObject.fitBounds(bounds)
        }
      }
  }

  @Watch('layer')
  onLayerChange (): void {
    this.setDefaultZoom()
    if (!this.isInitialized) return
    if (this.layer === null) {
      this.removeLayer();
      this.removeOldLayers();
      return
    }
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
      const bounds = this.mapObject.getBounds()
      const canvas = this.mapObject.getCanvas()
      const rasterSource: ImageSourceRaw = {
        type: 'image',
        url: `${baseUrl}/wms?service=WMS&request=GetMap&version=1.3&layers=${this.layer.name}&crs=EPSG:3857&bbox=${getMercatorBboxFromBounds(bounds)}&height=${canvas.height}&width=${canvas.width}&time=${time}`,
        coordinates: getCoordsFromBounds(bounds)
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

  removeLayer() {
    if(this.mapObject !== undefined) {
      const layerId = getFrameId(this.currentLayer, this.counter)
      if(this.mapObject.getSource(layerId) !== undefined) {
        this.mapObject.removeLayer(layerId)
        this.mapObject.removeSource(layerId)
      }
    }
  }

  destroyed() {
    this.removeLayer();
    this.removeOldLayers();
  }

}
</script>

