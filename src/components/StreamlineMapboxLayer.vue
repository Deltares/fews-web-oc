<template>
  <div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Vue } from "vue-property-decorator"
import type { MapboxLayerOptions } from '@/components/AnimatedMapboxLayer.vue';
import type { Map } from 'mapbox-gl';

@Component({})
export default class StreamlineMapboxLayer extends Vue {
  @Prop({
    default: () => {
      return null
    },
  })
  layer!: MapboxLayerOptions | null

  @Inject() getMap!: () => Map

  mapObject!: Map

  deferredMountedTo(map: Map) {
    this.mapObject = map
  }
}
</script>
