<template>
  <div>
    <!-- Download Dialog -->
    <v-dialog v-model="downloadDialog" max-width="500">
      <v-card>
        <v-card-title>Download netCDF Data</v-card-title>
        <v-card-text>
          <v-form>
            <v-container>
              <v-row class="text-h6">Step Sizes</v-row>
              <v-row>
                <v-col cols="3">
                  <v-text-field v-model.number="dx"
                                type="number"
                                suffix="m"
                                label="x-direction"
                                min="0"
                                step="0.1"
                                required/>
                </v-col>
                <v-col cols="1"/>
                <v-col cols="3">
                  <v-text-field v-model.number="dy"
                                type="number"
                                suffix="m"
                                label="y-direction"
                                min="0"
                                step="0.1"
                                required/>
                </v-col>
              </v-row>
              <v-row v-if="bbox" class="text-h6">Bounding Box</v-row>
              <v-row v-if="bbox">
                <v-row justify="left">
                  <v-col cols="3">
                    <v-text-field v-model.number="bbox[0]"
                                  type="number"
                                  label="xMin"
                                  :rules="[() => bbox[2] > bbox[0] || 'This value need to be smaller than Xmax']"
                                  step="0.1"
                                  @change="updateRectangle"
                                  required/>
                  </v-col>
                  <v-col cols="1"/>
                  <v-col cols="3">
                    <v-text-field v-model.number="bbox[1]"
                                  type="number"
                                  label="yMin"
                                  :rules="[() => bbox[3] > bbox[1] || 'This value need to be smaller than Ymax']"
                                  step="0.1"
                                  @change="updateRectangle"
                                  required/>
                  </v-col>
                </v-row>
                <v-row justify="left">
                  <v-col cols="3">
                    <v-text-field v-model.number="bbox[2]"
                                  type="number"
                                  label="xMax"
                                  :rules="[() => bbox[2] > bbox[0] || 'This value need to be larger than Xmin']"
                                  step="0.1"
                                  @change="updateRectangle"
                                  required/>
                  </v-col>
                  <v-col cols="1"/>
                  <v-col cols="3">
                    <!-- only show first two decimals -->
                    <v-text-field v-model.number="bbox[3]"
                                  type="number"
                                  label="yMax"
                                  :rules="[() => bbox[3] > bbox[1] || 'This value need to be larger than Ymin']"
                                  step="0.1"
                                  @change="updateRectangle"
                                  required/>
                  </v-col>
                </v-row>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" class="ma-2" @click="downloadClicked">Download</v-btn>
          <v-btn color="error" class="ma-2" @click="closeDownloadDialog">Close</v-btn>
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
import { ProcessDataFilter } from '@deltares/fews-pi-requests'

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
  dx = 0.1
  dy = 0.1
  errorMessage = 'Select an area on the map before downloading the data.'
  bbox: number[] | null = null
  webServiceProvider!: PiWebserviceProvider

  created(): void {
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const transformRequestFn = this.getTransformRequest()
    this.webServiceProvider = new PiWebserviceProvider(baseUrl, { transformRequestFn })
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
      const xmin = Math.round(Math.min(...x) * 1000) / 1000
      const xmax = Math.round(Math.max(...x) * 1000) / 1000
      const ymin = Math.round(Math.min(...y) * 1000) / 1000
      const ymax = Math.round(Math.max(...y) * 1000) / 1000
      this.bbox = [xmin, ymin, xmax, ymax]
      this.refreshDownloadControl(this.bbox)
    }
  }

  addToMap() {
    const customStyles = [
      {
        id: 'gl-draw-polygon-fill-inactive',
        type: 'fill',
        filter: ['all', ['==', 'active', 'false'],
          ['==', '$type', 'Polygon'],
          ['!=', 'mode', 'static']
        ],
        paint: {
          'fill-color': '#c2bebe',
          'fill-outline-color': '#626262',
          'fill-opacity': 0.5
        }
      },
      {
        id: 'gl-draw-polygon-fill-active',
        type: 'fill',
        filter: ['all', ['==', 'active', 'true'],
          ['==', '$type', 'Polygon']
        ],
        paint: {
          'fill-color': '#c2bebe',
          'fill-outline-color': '#626262',
          'fill-opacity': 0.4
        }
      },
      {
        id: 'gl-draw-polygon-stroke-inactive',
        type: 'line',
        filter: ['all', ['==', 'active', 'false'],
          ['==', '$type', 'Polygon'],
          ['!=', 'mode', 'static']
        ],
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#000000',
          'line-width': 2
        }
      },
      {
        id: 'gl-draw-polygon-stroke-active',
        type: 'line',
        filter: ['all', ['==', 'active', 'true'],
          ['==', '$type', 'Polygon']
        ],
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#000000',
          'line-dasharray': [0.2, 2],
          'line-width': 2
        }
      },
    ]

    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      modes: Object.assign(MapboxDraw.modes, {
        draw_rectangle: DrawRectangle,
      } as any),// library type definition is not complete
      styles: customStyles,
      defaultMode: 'simple_select',
    })

    this.mapObject.addControl(this.draw)
    this.mapObject.on('draw.create', this.select)
    this.mapObject.on("draw.modechange", (e) => {
      if (e.mode === "direct_select") {
        this.draw.changeMode("simple_select")
      }
    })

    const trashElement = document.querySelector(".mapbox-gl-draw_trash") as HTMLElement
    if (trashElement) {
      trashElement.addEventListener("click", (event) => {
        event.preventDefault()
        this.draw.deleteAll()
        this.refreshDownloadControl(null)
      }, {capture: true}) // ensure that this handler is executed before the bubbling
    }
    const drawCombine = document.querySelector(".mapbox-gl-draw_polygon") as HTMLElement
    if (drawCombine) {
        drawCombine.setAttribute("title", "Select Area")
        drawCombine.addEventListener("click", (event) => {
          event.preventDefault()
          this.draw.deleteAll()
          this.draw.changeMode("draw_rectangle")
        }, {capture: true}) // ensure that this handler is executed before the bubbling
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
    }
  }

  downloadInputsAreValid() {
    if (!this.bbox) {
      return false
    }

    // Invalid when along x or y, min > max
    if (this.bbox[0] > this.bbox[2] ||
        this.bbox[1] > this.bbox[3]) {
      return false
    }

    const inputValues = [
      this.dx,
      this.dy,
      ...this.bbox
    ]

    return inputValues.every((v) => !isNaN(v) && v > 0)
  }

  downloadClicked() {
    const workflowId = `Regrid_${this.$route.params.dataSourceId}`
    const fileName = `regrid_${this.$route.params.dataSourceId}.nc`
    if (this.bbox && this.downloadInputsAreValid()) {
      const filter: ProcessDataFilter = {
        workflowId: workflowId,
        xMin: this.bbox[0],
        yMin: this.bbox[1],
        xMax: this.bbox[2],
        yMax: this.bbox[3],
        xCellSize: this.dx,
        yCellSize: this.dy,
        startTime: this.firstValueTime,
        endTime: this.lastValueTime
      }

      const apiUrl = this.webServiceProvider.processDataUrl(filter).toString()
      this.downloadDialog = false
      this.downloadNetCDF(apiUrl, fileName)
    } else {
      // Handle invalid input
      this.openErrorDialog('Invalid input. Please enter valid values for dx, dy and bounding box extremes.')
    }
  }

  updateRectangle() {
    const data = this.draw.getAll()
    // get bbox from data
    const geometry = data.features[0].geometry
    const featureId = data.features[0].id
    if (geometry.type == "Polygon" && geometry.coordinates !== null && this.bbox) {
      const coordinates = geometry.coordinates[0]

      const x = coordinates.map(c => c[0])
      const y = coordinates.map(c => c[1])

      const xmin = Math.min(...x)
      const xmax = Math.max(...x)
      const ymin = Math.min(...y)
      const ymax = Math.max(...y)

      for (let i = 0; i < coordinates.length; i++) {
        const point = coordinates[i];

        if (point[0] === xmin) point[0] = this.bbox[0]
        if (point[1] === ymin) point[1] = this.bbox[1]
        if (point[0] === xmax) point[0] = this.bbox[2]
        if (point[1] === ymax) point[1] = this.bbox[3]
      }

      this.draw.set({
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {},
          id: featureId,
          geometry: { type: 'Polygon', coordinates: [coordinates]}
        }]
      })
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

  private async downloadNetCDF(apiUrl: string, fileName: string) {
    const icon = document.querySelector('#download-icon')
    icon?.classList.remove('mdi-download')
    icon?.classList.add('mdi-loading')
    icon?.classList.add('mdi-spin')
    try {
      const response = await fetch(apiUrl);
      // Set file name based on response header
      const contentDisposition = response.headers.get('Content-Disposition')
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=(.+)/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1]
        }
      }

      const blob = await response.blob()

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
    } catch (error) {
      console.error('Error:', error)
      // Handle the error and display an error message
      this.openErrorDialog('An error occurred while downloading data.')
    } finally {
      icon?.classList.remove('mdi-loading')
      icon?.classList.remove('mdi-spin')
      icon?.classList.add('mdi-download')
    }
  }
}
</script>

<style scoped>
.v-input >>> input[type="number"]:not(:hover):not(:focus) {
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
  appearance: textfield;
}

.v-input >>> input[type=number]::-webkit-inner-spin-button:not(:hover):not(:focus),
.v-input >>> input[type=number]::-webkit-outer-spin-button:not(:hover):not(:focus) {
  -webkit-appearance: none;
}
</style>
