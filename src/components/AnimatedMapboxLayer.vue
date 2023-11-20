<template>
  <div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Vue, Watch } from "vue-property-decorator"
import {
  EventData,
  ImageSource,
  ImageSourceRaw,
  LngLatBounds,
  Map,
  RasterLayer,
} from "mapbox-gl"
import { point } from "@turf/helpers"
import { toMercator } from "@turf/projection"
import { BoundingBox } from "@deltares/fews-wms-requests"
import { toWgs84 } from "@turf/projection"

function getCoordsFromBounds(bounds: LngLatBounds) {
  return [
    bounds.getNorthWest().toArray(),
    bounds.getNorthEast().toArray(),
    bounds.getSouthEast().toArray(),
    bounds.getSouthWest().toArray(),
  ]
}

function isBoundsWithinBounds(
  innerBounds: LngLatBounds,
  outerBounds: LngLatBounds
) {
  const innerNorthEast = innerBounds.getNorthEast()
  const innerSouthWest = innerBounds.getSouthWest()
  const outerNorthEast = outerBounds.getNorthEast()
  const outerSouthWest = outerBounds.getSouthWest()

  const isLngWithin =
    innerSouthWest.lng >= outerSouthWest.lng &&
    innerNorthEast.lng <= outerNorthEast.lng
  const isLatWithin =
    innerSouthWest.lat >= outerSouthWest.lat &&
    innerNorthEast.lat <= outerNorthEast.lat
  return isLngWithin && isLatWithin
}

export function convertBoundingBoxToLngLatBounds(
  boundingBox: BoundingBox
): LngLatBounds {
  const crs = boundingBox.crs

  const minx = parseFloat(boundingBox.minx)
  const miny = parseFloat(boundingBox.miny)
  const maxx = parseFloat(boundingBox.maxx)
  const maxy = parseFloat(boundingBox.maxy)

  const p1 = toWgs84(point([minx, miny], { crs: crs }))
  const p2 = toWgs84(point([maxx, maxy], { crs: crs }))
  return new LngLatBounds(
    [p1.geometry.coordinates[0], p1.geometry.coordinates[1]], // sw
    [p2.geometry.coordinates[0], p2.geometry.coordinates[1]] // ne
  )
}

export interface MapboxLayerOptions {
  name: string
  time: Date
  bbox: LngLatBounds
  elevation?: number | null
  colorScaleRange?: string
}

function getMercatorBboxFromBounds(bounds: LngLatBounds): number[] {
  const sw = toMercator(point(bounds.getSouthWest().toArray()))
  const ne = toMercator(point(bounds.getNorthEast().toArray()))
  return [...sw.geometry.coordinates, ...ne.geometry.coordinates]
}

@Component
export default class AnimatedMapboxLayer extends Vue {
  @Prop({
    default: () => {
      return null
    },
  })
  layer!: MapboxLayerOptions | null

  @Inject() getMap!: () => Map

  mapObject!: Map
  isInitialized = false
  counter = 0
  currentLayer: string = ""

  mounted() {
    const map = this.getMap()
    if (map && map.isStyleLoaded()) {
      this.mapObject = map
      this.isInitialized = true
      this.onLayerChange()
    }
  }

  deferredMountedTo(map: Map) {
    this.mapObject = map
    this.mapObject.once("load", () => {
      this.isInitialized = true
      this.onLayerChange()

      this.enableDoubleClickLayer()
      this.enableClickLocationsLayer()
    })
    this.mapObject.on("moveend", () => {
      this.updateSource()
    })
    this.mapObject.on("data", async (e) => {
      if (
        e.sourceId === this.currentLayer &&
        e.tile !== undefined &&
        e.isSourceLoaded
      ) {
        this.mapObject.setPaintProperty(e.sourceId, "raster-opacity", 1)
      }
    })
  }

  updateSource() {
    if (this.layer === null) return
    const source = this.mapObject.getSource(this.currentLayer) as ImageSource
    const bounds = this.mapObject.getBounds()
    const canvas = this.mapObject.getCanvas()
    const baseUrl = this.$config.get("VUE_APP_FEWS_WEBSERVICES_URL")
    let url = this.createGetMapUrl(baseUrl, bounds, canvas)
    source.updateImage({
      url: url,
      coordinates: getCoordsFromBounds(bounds),
    })
  }

  createSource() {
    const baseUrl = this.$config.get("VUE_APP_FEWS_WEBSERVICES_URL")
    const bounds = this.mapObject.getBounds()
    const canvas = this.mapObject.getCanvas()
    const url = this.createGetMapUrl(baseUrl, bounds, canvas)

    const rasterSource: ImageSourceRaw = {
      type: "image",
      url: url,
      coordinates: getCoordsFromBounds(bounds),
    }
    this.mapObject.addSource(this.currentLayer, rasterSource)
    const rasterLayer: RasterLayer = {
      id: this.currentLayer,
      type: "raster",
      source: this.currentLayer,
      paint: {
        "raster-opacity": 0,
        "raster-opacity-transition": {
          duration: 0,
          delay: 0,
        },
        "raster-fade-duration": 0,
      },
    }
    this.mapObject.addLayer(rasterLayer, "boundary_country_outline")
  }

  private createGetMapUrl(
    baseUrl: string,
    bounds: LngLatBounds,
    canvas: HTMLCanvasElement,
  ) {
    if (this.layer === null) return

    const time = this.layer.time.toISOString()

    const getMapUrl = new URL(`${baseUrl}/wms`)
    getMapUrl.searchParams.append('service', 'WMS')
    getMapUrl.searchParams.append('request', 'GetMap')
    getMapUrl.searchParams.append('version', '1.3')
    getMapUrl.searchParams.append('layers', this.layer.name)
    getMapUrl.searchParams.append('crs', 'EPSG:3857')
    getMapUrl.searchParams.append('bbox', `${getMercatorBboxFromBounds(bounds)}`)
    getMapUrl.searchParams.append('height', `${canvas.height}`)
    getMapUrl.searchParams.append('width', `${canvas.width}`)
    getMapUrl.searchParams.append('time', `${time}`)

    if (this.layer.elevation) {
      getMapUrl.searchParams.append('elevation', `${this.layer.elevation}`)
    }

    if (this.layer.colorScaleRange) {
      getMapUrl.searchParams.append('colorScaleRange', `${this.layer.colorScaleRange}`)
      getMapUrl.searchParams.append('useDisplayUnits', 'true')
    }

    return getMapUrl.toString()
  }

  setDefaultZoom() {
    if (this.layer === null || this.layer.bbox === undefined) return
    if (this.mapObject) {
      const currentBounds = this.mapObject.getBounds()
      const bounds = this.layer.bbox
      if (isBoundsWithinBounds(currentBounds, bounds)) {
        return
      } else {
        this.$nextTick(() => {
          this.mapObject.fitBounds(bounds)
        })
      }
    }
  }

  enableDoubleClickLayer() {
    // deactivate double click zoom
    this.mapObject.doubleClickZoom.disable()

    this.mapObject.on("dblclick", (e) => {
      this.$emit("doubleclick", e)
    })
  }

  enableClickLocationsLayer() {
    const handleLocationClick = (e: EventData) => {
      this.$emit("locationclick", e)
    }
    this.mapObject.on("click", "locationsLayer", handleLocationClick)
    this.mapObject.on("touchend", "locationsLayer", handleLocationClick)
  }

  @Watch("layer")
  onLayerChange(): void {
    if (!this.isInitialized) return

    if (this.layer === null) {
      this.removeLayer()
      return
    }

    if (this.layer.name === undefined || this.layer.time === undefined) {
      return
    }

    if (this.layer.name !== this.currentLayer) {
      this.removeLayer()
      this.currentLayer = this.layer.name

      // set default zoom only if layer is changed
      this.setDefaultZoom()
    }


    const source = this.mapObject.getSource(this.currentLayer)
    if (source === undefined) {
      this.createSource()
    } else {
      this.updateSource()
    }
  }

  removeLayer() {
    if (this.mapObject !== undefined) {
      if (this.mapObject.getSource(this.currentLayer) !== undefined) {
        this.mapObject.removeLayer(this.currentLayer)
        this.mapObject.removeSource(this.currentLayer)
      }
    }
  }

  destroyed() {
    this.removeLayer()
  }
}
</script>
