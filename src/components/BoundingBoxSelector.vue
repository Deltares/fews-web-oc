<template>
    <div />
</template>

<script lang="ts">
import { Component, Vue, Inject } from 'vue-property-decorator'
import { Map } from 'mapbox-gl'
import MapboxDraw, {DrawEvent} from '@mapbox/mapbox-gl-draw'

@Component
export default class BoundingBoxSelector extends Vue {
    @Inject() getMap!: () => Map

    mapObject!: Map
    isInitialized = false
    draw!: MapboxDraw

    deferredMountedTo(map: Map) {
        this.mapObject = map
        this.mapObject.dragRotate.disable()
        this.mapObject.touchZoomRotate.disableRotation()
        this.mapObject.once('load', () => {
        this.isInitialized = true
        this.addToMap()
    })
    }

    download(e: DrawEvent) {
    const data = this.draw.getAll();
    if (data.features.length > 0) {
    console.log("hi")
    }
    }
    addToMap() {
        this.draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
        polygon: true,
        trash: true
        },
        defaultMode: 'draw_polygon'
        });
        this.mapObject.addControl(this.draw);
        this.mapObject.on('draw.create', this.download);
        this.mapObject.on('draw.delete', this.download);
        this.mapObject.on('draw.update', this.download);
        const trashElement = document.querySelector(".mapbox-gl-draw_trash");
        if (trashElement !== null) {
            trashElement.addEventListener("click", () => {
                this.draw.deleteAll();
                })
        }
    }

    mounted() {
    const map = this.getMap();
    if (map && map.loaded()) {
        this.mapObject = map
        this.isInitialized = true
        this.addToMap()
    }
  }

}
</script>
  