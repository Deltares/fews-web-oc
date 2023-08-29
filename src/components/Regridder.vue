<template>
    <div />
</template>

<script lang="ts">
import { Component, Vue, Inject, Watch, Prop } from 'vue-property-decorator'
import { Map } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import DrawRectangle from "mapbox-gl-draw-rectangle-restrict-area"
import {DownloadControl} from "../lib/DownloadControl"

@Component
export default class Regridder extends Vue {
    @Inject() getMap!: () => Map

    mapObject!: Map
    isInitialized = false
    draw!: MapboxDraw
    downloadControl: DownloadControl | undefined
     
    deferredMountedTo(map: Map) {
        this.mapObject = map
        this.mapObject.dragRotate.disable()
        this.mapObject.touchZoomRotate.disableRotation()
        this.mapObject.once('load', () => {
        this.isInitialized = true
        this.addToMap()
    })
    }

    refreshDownloadControl(bbox: number[] | undefined ) {
        if (this.downloadControl){
            this.mapObject.removeControl(this.downloadControl)
        }
        this.downloadControl = new DownloadControl(bbox)
        this.mapObject.addControl(this.downloadControl)
    }

    select() {
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
            const bbox = [xmin, ymin, xmax, ymax]
            this.refreshDownloadControl(bbox)
        }
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
        defaultMode: 'draw_rectangle',
        })

        this.mapObject.addControl(this.draw)

        this.draw.changeMode("draw_rectangle", {
            inactivityTimeout: 0, // Prevents automatic selection
            repeatMode: false, // Disables repeat mode
            allowCreateExceeded: false,
            exceedCallsOnEachMove: false,
            clickBuffer: 0, // Disables click-to-select
        })

        this.mapObject.on('draw.create', this.select)
        // this.mapObject.on('draw.update', this.select)

        const trashElement = document.querySelector(".mapbox-gl-draw_trash")
        if (trashElement !== null) {
            trashElement.addEventListener("click", () => {
                this.draw.deleteAll()
                this.refreshDownloadControl(undefined)
            })
        }
        const drawCombine = document.querySelector(".mapbox-gl-draw_polygon")
        if (drawCombine !== null) {
            drawCombine.addEventListener("click", () => {
                this.draw.deleteAll()
                this.draw.changeMode("draw_rectangle")
            })
        }
        // Create the DownloadControl initially
        this.downloadControl = new DownloadControl(undefined)
        this.mapObject.addControl(this.downloadControl)
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
  