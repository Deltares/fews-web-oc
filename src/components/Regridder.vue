<template>
  <div>
    <!-- Download Dialog -->
    <v-dialog v-model="downloadDialog" max-width="500">
      <v-card>
        <v-card-title>Download netCDF Data</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field v-model="dx" type="number" label="Step size in x-direction [m]"
              required></v-text-field>
            <v-text-field v-model="dy" type="number" label="Step size in y-direction [m]"
              required></v-text-field>
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
import { Component, Inject, Mixins, Prop } from 'vue-property-decorator'
import { Map } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import DrawRectangle from '@/lib/MapBox/DrawRectangleMode'
import { DownloadControl } from "../lib/MapBox/DownloadControl"
import { PiWebserviceProvider } from "@deltares/fews-pi-requests"  
import PiRequestsMixin from '@/mixins/PiRequestsMixin'  

@Component
export default class Regridder extends Mixins(PiRequestsMixin) {
  @Inject() getMap!: () => Map

  @Prop() firstValueTime!: string
  @Prop() lastValueTime!: string

  mapObject!: Map
  isInitialized = false
  draw!: MapboxDraw
  downloadControl!: DownloadControl
  downloadDialog = false
  errorDialog = false
  dx = '0.1'
  dy = '0.1'
  errorMessage = 'Select an area on the map before downloading the data.'
  bbox: number[] | null = null
  webServiceProvider!: PiWebserviceProvider
  baseUrl: string | null = null

  created(): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const transformRequestFn = this.getTransformRequest()
    this.webServiceProvider = new PiWebserviceProvider(this.baseUrl, { transformRequestFn })
  }

  deferredMountedTo(map: Map) {
    this.mapObject = map
    this.mapObject.dragRotate.disable()
    this.mapObject.touchZoomRotate.disableRotation()
    this.mapObject.once('load', () => {
      this.isInitialized = true
      this.addToMap()
    })
  }

  refreshDownloadControl(bbox: number[] | null) {
    if (this.downloadControl) {
      this.mapObject.removeControl(this.downloadControl)
    }
    this.downloadControl = new DownloadControl(bbox, this)
    this.mapObject.addControl(this.downloadControl)
  }

  select() {
    const data = this.draw.getAll()
    // get bbox from data
    const geometry = data.features[0].geometry
    if (geometry.type == "Polygon" && geometry.coordinates !== null) {
      const coordinates = geometry.coordinates[0]
      const x = coordinates.map(c => c[0])
      const y = coordinates.map(c => c[1])
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
      modes: Object.assign(MapboxDraw.modes, {
        draw_rectangle: DrawRectangle,
      } as any),
      defaultMode: 'draw_rectangle',
    })

    this.mapObject.addControl(this.draw)
    this.mapObject.on('draw.create', this.select)

    const trashElement = document.querySelector(".mapbox-gl-draw_trash")
    if (trashElement !== null) {
      trashElement.addEventListener("click", () => {
        this.draw.deleteAll()
        this.refreshDownloadControl(null)
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
    this.downloadControl = new DownloadControl(null, this)
    this.mapObject.addControl(this.downloadControl)
  }

  mounted() {
    const map = this.getMap()
    if (map && map.loaded()) {
      this.mapObject = map
      this.isInitialized = true
      this.addToMap()
    }
  }
  downloadClicked() {
    const dx = parseFloat(this.dx)
    const dy = parseFloat(this.dy)

    if (!isNaN(dx) && !isNaN(dy) && dx > 0 && dy > 0 && this.bbox !== null) {
      const workflowId = 'Transformation_ASA_Grid_Wind' // todo: change this when available
      const xMin = this.bbox[0]
      const yMin = this.bbox[1]
      const xMax = this.bbox[2]
      const yMax = this.bbox[3]
      const xCellSize = dx
      const yCellSize = dy
      const startTime = this.firstValueTime
      const endTime = this.lastValueTime
      // todo: change this with fews-pi-requests
      const apiUrl = `${this.baseUrl}rest/fewspiservice/v1/processdata?workflowId=${workflowId}&xMin=${xMin}&yMin=${yMin}&xMax=${xMax}&yMax=${yMax}&xCellSize=${xCellSize}&yCellSize=${yCellSize}&startTime=${startTime}&endTime=${endTime}`
      this.downloadDialog = false
      this.downloadNetCDF(apiUrl)
    } else {
      // Handle invalid input
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

  private downloadNetCDF(apiUrl: string) {
    let fileName = 'openarchive-netcdf.nc'
    const icon = document.querySelector('#download-icon')
    icon?.classList.remove('mdi-download')
    icon?.classList.add('mdi-loading')
    icon?.classList.add('mdi-spin')
    fetch(apiUrl)
      .then((response) => {
        // set file name base on response header
        const contentDisposition = response.headers.get('Content-Disposition')
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename=(.+)/)
          if (fileNameMatch) {
            fileName = fileNameMatch[1]
          }
        }
        return response.blob()  
      })
      .then((blob) => {
        // Create a temporary URL for the Blob
        const blobUrl = window.URL.createObjectURL(blob)  

        // Create a temporary anchor element to trigger the download
        const downloadLink = document.createElement('a')
        downloadLink.href = blobUrl
        downloadLink.download = fileName
        downloadLink.style.display = 'none'

        // Append the anchor element to the DOM and click it to trigger the download
        document.body.appendChild(downloadLink)
        downloadLink.click()
        downloadLink.remove()
        window.URL.revokeObjectURL(blobUrl)
        this.downloadDialog = false
      })
      .catch((error) => {
        console.error('Error:', error)
        // Handle the error and display an error message
        this.openErrorDialog('An error occurred while downloading data.')
      })
      .finally(() => {
        icon?.classList.remove('mdi-loading')
        icon?.classList.remove('mdi-spin')
        icon?.classList.add('mdi-download')
      })
  }

}
</script>
