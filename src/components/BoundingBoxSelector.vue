<template>
    <div />
</template>

<script lang="ts">
import { Component, Vue, Inject } from 'vue-property-decorator'
import { Map } from 'mapbox-gl'
import MapboxDraw, {DrawEvent} from '@mapbox/mapbox-gl-draw'
import DrawRectangle from "mapbox-gl-draw-rectangle-restrict-area"


@Component
export default class BoundingBoxSelector extends Vue {
    @Inject() getMap!: () => Map

    mapObject!: Map
    isInitialized = false
    draw!: MapboxDraw
    bbox: number[] = []

    deferredMountedTo(map: Map) {
        this.mapObject = map
        this.mapObject.dragRotate.disable()
        this.mapObject.touchZoomRotate.disableRotation()
        this.mapObject.once('load', () => {
        this.isInitialized = true
        this.addToMap()
    })
    }

    select(e: DrawEvent) {
    const data = this.draw.getAll();
    // get bbox from data
    const geometry: any = data.features[0].geometry // change any  to proper type
    if (geometry.coordinates !== null) {
        const coordinates = geometry.coordinates[0]
        const x = coordinates.map((c: any) => c[0])
        const y = coordinates.map((c: any) => c[1])
        const xmin = Math.min(...x)
        const xmax = Math.max(...x)
        const ymin = Math.min(...y)
        const ymax = Math.max(...y)
        this.bbox = [xmin, ymin, xmax, ymax]
    }
    console.log("bbox", this.bbox)
    }
    addToMap() {
        this.draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: true,
            trash: true,
        },
        modes:  Object.assign(MapboxDraw.modes, {
            draw_rectangle: DrawRectangle,
        } as any),
        defaultMode: 'draw_rectangle'
        })
        this.mapObject.addControl(this.draw)
        this.draw.changeMode("draw_rectangle", {
        escapeKeyStopsDrawing: true, // default true
        allowCreateExceeded: false, // default false
        exceedCallsOnEachMove: false, // default false
        })
        this.mapObject.on('draw.create', this.select)
        this.mapObject.on('draw.update', this.select)
        const trashElement = document.querySelector(".mapbox-gl-draw_trash")
        if (trashElement !== null) {
            trashElement.addEventListener("click", () => {
                this.draw.deleteAll();
                })
        }
        const drawCombine = document.querySelector(".mapbox-gl-draw_polygon")
        if (drawCombine !== null) {
            drawCombine.addEventListener("click", () => {
                this.draw.changeMode("draw_rectangle");
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
  