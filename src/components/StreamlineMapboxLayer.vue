<template>
  <div ref="mapboxgl-map">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator"
import type { MapboxLayerOptions } from '@/components/AnimatedMapboxLayer.vue';
import { Map } from 'mapbox-gl';
import { WMSStreamlineLayer, type WMSStreamlineLayerOptions } from '@/lib/StreamLines/layer'
import { StreamlineStyle } from "@/lib/StreamLines/render";

function configureAutoAdjustSettings(layer: WMSStreamlineLayer): void {
  // Attempt to fix frame rate issues by reducing the "quality" of the
  // streamlines, i.e. reduce the number of substeps per frame.
  const desiredFrameRate = 30
  const margin = 5

  let maxDisplacement = WMSStreamlineLayer.MAX_PARTICLE_DISPLACEMENT
  const adjustFactor = 1.1
  const maxDisplacementMin = 2
  const maxDisplacementMax = 100
  const adjustQuality = () => {
    if (layer.fps < desiredFrameRate - margin) {
      maxDisplacement = Math.min(
        maxDisplacement * adjustFactor,
        maxDisplacementMax
      )
    } else if (layer.fps > desiredFrameRate + margin) {
      maxDisplacement = Math.max(
        maxDisplacement / adjustFactor,
        maxDisplacementMin
      )
    }
    layer.updateVisualiserOptions({ maxDisplacement })
  }
  window.setInterval(adjustQuality, 100)
}

@Component({})
export default class StreamlineMapboxLayer extends Vue {
  @Prop({
    default: () => {
      return null
    },
  })
  layer!: MapboxLayerOptions | null

  mapObject!: Map
  isInitialized = false
  currentLayer: string = ""

  deferredMountedTo(map: Map) {
    this.mapObject = map

    this.mapObject.once("load", () => {
      this.isInitialized = true
      this.createLayer()
    })
  }

  createLayer(): void {
    if (!this.isInitialized) return

    if (this.layer === null) return

    if (this.layer.name === undefined || this.layer.time === undefined) {
      return
    }

    if (this.layer.name !== this.currentLayer) {
      this.currentLayer = this.layer.name
      const layerOptions: WMSStreamlineLayerOptions = {
        baseUrl: `${this.$config.get("VUE_APP_FEWS_WEBSERVICES_URL")}/wms`,
        layer: this.currentLayer,
        style: 'Select a style',
        downsampleFactorWMS: 4,
        streamlineStyle: StreamlineStyle.LightParticlesOnMagnitude,
        numParticles: 10000,
        particleSize: 4,
        speedFactor: 0.2,
        fadeAmountPerSecond: 3
      }
      const streamlineLayer = new WMSStreamlineLayer(layerOptions)
      streamlineLayer.on('load', () => {
        configureAutoAdjustSettings(streamlineLayer)
      })
      this.mapObject.addLayer(streamlineLayer)
    }
  }
}
</script>

<style>
.mapboxgl-map {
  height: 100%;
  width: 100%;
}
</style>
