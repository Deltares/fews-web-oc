<template>
  <div class="display-container">
    <portal to="web-oc-sidebar">
      <div class="sidebar-content">
        <v-divider></v-divider>
        <v-subheader>filters</v-subheader>
        <v-list expand nav>
          <v-list-item v-for="filter in filters" :key="filter.id" link :to="{ name: 'FilterView', params: { filterId: filter.id } }">
            <v-list-item-icon>
              <v-icon>{{ filter.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ filter.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-divider></v-divider>
        <v-subheader>categories</v-subheader>
        <v-list expand nav>
          <v-list-item v-for="(c, i) of categories" :key="i" :to="{ name: 'FilterView', params: { filterId, categoryId: c } }">
            <v-list-item-content>
              <v-list-item-title>{{ c }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </portal>
    <div class="grid-root" :class="layoutClass">
      <div class="grid-map" v-show="showMap">
        <div class="map-container">
          <MapComponent>
            <v-mapbox-layer :options="layerA" clickable @click="onLocationClick"></v-mapbox-layer>
          </MapComponent>
        </div>
    </div>
    <div class="grid-charts" ref="grid-charts" v-if="hasSelectedLocation && !$vuetify.breakpoint.mobile">
      <v-toolbar class="toolbar-charts" dense flat>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon plain @click="onDockModeChange('left')">
            <v-icon>mdi-dock-left</v-icon>
          </v-btn>
          <v-btn icon plain @click="onDockModeChange('bottom')">
            <v-icon>mdi-dock-bottom</v-icon>
          </v-btn>
          <v-btn icon plain @click="onDockModeChange('right')">
            <v-icon>mdi-dock-right</v-icon>
          </v-btn>
          <v-btn icon plain @click="closeCharts">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <router-view @toggleFullscreen="toggleFullscreen"></router-view>
    </div>
    <div class="grid-charts fullscreen" ref="grid-charts" v-if="hasSelectedLocation && $vuetify.breakpoint.mobile">
      <v-toolbar class="toolbar-charts" dense flat>
        <v-toolbar-title>
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn icon plain @click="closeCharts">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <router-view :message="currentParameters">
      </router-view>
    </div>
  </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { PiWebserviceProvider } from "@deltares/fews-pi-requests";
import { uniq } from 'lodash';
import { Location } from '@deltares/fews-pi-requests/src/response';
import { Route } from 'vue-router';
import MapComponent from '../components/MapComponent.vue'

interface Filter {
  id: string;
  name: string;
  icon?: string;
}

interface Parameter {
  id: string;
  name: string;
  icon?: string;
  parameterGroup: string;
}

@Component({
  components: {
    MapComponent,
  }
}
)
export default class FilterView extends Vue {
  @Prop({ default: '', type: String })
  filterId!: string

  @Prop({ default: '', type: String })
  categoryId!: string

  @Prop({ default: '', type: String })
  locationId!: string

  stateDockMode = 'right'
  layoutClass: string = 'map-only'
  isFullscreenGraph = false

  filters: Filter[] = []
  webServiceProvider!: PiWebserviceProvider
  parameters: Parameter[] = []
  currentFilterId: string = ''
  currentCategoryId: string = ''
  currentParameters: Parameter[] = []
  categories: string[] = []
  locations: Location[]=  []
  layerA = {
    'id': 'a',
    'type': 'circle',
    'source': {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [-1, 49],
              [-1, 61],
              [11, 61],
              [11, 49],
              [-1, 49]
            ]
          ]
        }
      }
    },
    'layout': {
      'visibility': 'visible'
    },
    'paint': {
      'circle-radius': 6,
      'circle-color': '#B42222'
    },
  }


  async mounted () {
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    this.webServiceProvider = new PiWebserviceProvider(baseUrl)
    const response = await fetch(`${baseUrl}/rest/fewspiservice/v1/filters?documentFormat=PI_JSON`)
    const filters = (await response.json()).filters.map( (f: Filter) => {
      return {
        ...f, ...{ icon: `mdi-alpha-${f.name[0].toLowerCase()}-circle-outline`}
      }
    })
    this.filters = filters
    this.currentFilterId = filters[0].id
    this.getParameters()
    this.setLayoutClass(this.$route)

    // Force resize to fix strange starting position of the map, caused by
    // the expandable navigation drawer.
    window.dispatchEvent(new Event('resize'))
  }


  @Watch('filterId')
  async getParameters() {
    const filter = {
      filterId: this.currentFilterId
    }
    // const response = await this.webServiceProvider.getParameters(filter as any)
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const response = await fetch(`${baseUrl}/rest/fewspiservice/v1/parameters?documentFormat=PI_JSON&filterId=${this.currentFilterId}`)
    const parameters: Parameter[] = (await response.json()).timeSeriesParameters
    console.log(parameters)
    this.parameters = parameters
    this.categories = uniq(parameters.map( p => p.parameterGroup))
    this.currentCategoryId = this.categories[0]
    this.currentParameters = parameters.filter( (p) => p.parameterGroup === this.currentCategoryId )
    this.getLocations()
  }

  @Watch('categoryId')
  async getLocations() {
    const filter = {
      filterId: this.currentFilterId,
      parameterIds: 'H.obs'
    }
    // const response = await this.webServiceProvider.getParameters(filter as any)
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const response = await fetch(`${baseUrl}/rest/fewspiservice/v1/locations?documentFormat=GEO_JSON&filterId=${this.currentFilterId}&showAttributes=true`)
    const locations: any = await response.json()
    this.layerA.source.data = locations
  }

  setLayoutClass(route: Route): void {
    if (this.$vuetify.breakpoint.mobile) {
      this.layoutClass = 'mobile'
    } else if (route.params.locationId === undefined) {
      this.layoutClass = 'map-only'
      this.onResize()
    } else {
      this.onDockModeChange(this.dockMode)
    }
  }

  closeCharts() {
    if (this.hasSelectedLocation) {
      const params = this.$route.params
      this.$router.push({ name: 'FilterView', params: { filterId: params.filterId, categoryId: params.categoryId } })
    }
  }

  toggleFullscreen(isFullscreen: boolean) {
    this.isFullscreenGraph = isFullscreen
  }

  onResize() {
    window.dispatchEvent(new Event('resize'))
  }

  onLocationClick(e: any) {
    const locationId = e.features[0].properties.locationId
    console.log(locationId)
    this.$router.push({name: 'FilterViewWithLocation', params: { filterId: this.filterId, categoryId: this.categoryId, locationId }})
  }

  get hasSelectedLocation() {
    console.log('hasLocation', this.locationId)
    return this.locationId !== ''
  }

  get showMap() {
    const isMobileGraphOpen = this.hasSelectedLocation && this.$vuetify.breakpoint.mobile
    return !isMobileGraphOpen && !this.isFullscreenGraph
  }

  onDockModeChange(dockMode: string) {
    this.dockMode = dockMode
    if (this.hasSelectedLocation) {
      this.layoutClass = this.dockMode
    }
    this.$nextTick(this.onResize)
  }

  get dockMode() {
    return this.stateDockMode
  }

  set dockMode(dockMode: string) {
    this.stateDockMode = dockMode
  }

}
</script>

<style scoped>
.grid-root {
  display: flex;
  padding: 0px;
  width: 100%;
  height: 100%;
}

.grid-root.right {
  flex-direction: row;
}

.grid-root.left {
  flex-direction: row-reverse;
}

.grid-root.bottom {
  flex-direction: column;
}

.grid-map {
  display: flex;
  flex-basis: 400px;
  flex: 1 1 auto;
  flex-direction: column;
}

.grid-charts {
  display: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1100;
}

.right > .grid-charts,
.left > .grid-charts {
  height: 100%;
  width: 50%;
}

.bottom > .grid-charts {
  height: 50%;
  width: 100%;
}

.grid-charts.fullscreen {
  width: 100%;
  flex-basis: 100%;
  height: 100%;
}

.bottom>.grid-map {
  height: 50%;
  width: 100%;
}

.toolbar-charts {
  flex: 0 0 auto;
}

.colourbar {
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  margin-top: -50px;
  width: 500px;
  height: 100px;
}

.wms-panel {
  position: absolute;
  display: flex;
  flex-direction: column;
}

.wms-layer-control-container {
  display: flex;
  z-index: 1200;
  padding: 15px 50px 15px 50px;
}

.map-only>.wms-panel>.wms-layer-control-container,
.right>.wms-panel>.wms-layer-control-container {
  justify-content: flex-start;
}

.bottom>.wms-panel>.wms-layer-control-container,
.left>.wms-panel>.wms-layer-control-container {
  justify-content: flex-end;
}

.mobile>.wms-panel>.wms-layer-control-container {
  padding: 10px 0px;
  width: 100%;
  justify-content: center;
}

.map-only>.wms-panel,
.right>.wms-panel {
  left: 0px;
  bottom: 80px;
}

.left>.wms-panel {
  right: 0px;
  bottom: 80px;
}

.bottom>.wms-panel {
  top: 10px;
  right: 0px;
}

.mobile>.wms-panel {
  justify-content: center;
  bottom: 80px;
  width: 100%;
}

.map-container {
  display: flex;
  flex: 1 1;
  height: 100%;
}

.datetime-control-container {
  flex-grow: 0;
  z-index: 1000;
}
</style>
