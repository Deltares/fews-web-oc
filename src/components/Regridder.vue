<template>
    <div> 
      <!-- Download Dialog -->
      <v-dialog v-model="downloadDialog" max-width="500">
        <v-card>
          <v-card-title>Download netCDF Data</v-card-title>
          <v-card-text>
            <v-form>
              <v-text-field v-model="dx" label="dx" required></v-text-field>
              <v-text-field v-model="dy" label="dy" required></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="downloadClicked">Download</v-btn>
            <v-btn color="error" @click="closeDownloadDialog">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <!-- Error Dialog -->
      <v-dialog v-model="errorDialog" max-width="500">
        <v-card>
          <v-card-title>Error</v-card-title>
          <v-card-text>{{ errorMessage }}</v-card-text>
          <v-card-actions>
            <v-btn color="error" @click="closeErrorDialog">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </template>
  

<script lang="ts">
import { Component, Vue, Inject} from 'vue-property-decorator'
import { Map } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode'
import {DownloadControl} from "../lib/DownloadControl"

@Component
export default class Regridder extends Vue {
    @Inject() getMap!: () => Map

    mapObject!: Map
    isInitialized = false
    draw!: MapboxDraw
    downloadControl: DownloadControl | undefined
    downloadDialog = false
    errorDialog = false
    dx = ''
    dy = ''
    errorMessage = 'Select an area on the map before downloading the data.'
    bbox: number[] | undefined
        
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
        this.downloadControl = new DownloadControl(bbox, this)
        this.mapObject.addControl(this.downloadControl)
    }

    select() {
        const data = this.draw.getAll()
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
            this.refreshDownloadControl(this.bbox)
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

        this.draw.changeMode("draw_rectangle")

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
        this.downloadControl = new DownloadControl(undefined, this)
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
    downloadClicked() {
    const dx = parseFloat(this.dx)
    const dy = parseFloat(this.dy)

    if (!isNaN(dx) && !isNaN(dy) && dx > 0 && dy > 0) {
        // Perform your download operation with dx and dy
        console.log('dx:', dx)
        console.log('dy:', dy)
        console.log('bbox:', this.bbox)

        // Close the Vuetify dialog
        this.downloadDialog = false
    } else {
        // Handle invalid input
        this.closeDownloadDialog()
        this.openErrorDialog('Invalid input. Please enter valid values for dx and dy.')
    }
    }

    closeDownloadDialog() {
    this.downloadDialog = false
    }

    openErrorDialog(errorMessage: string) {
    this.errorMessage = errorMessage
    this.errorDialog = true
    }

    closeErrorDialog() {
    this.errorDialog = false
    // reset error message
    this.errorMessage = 'Select an area on the map before downloading the data.'
    }
}
</script>
  