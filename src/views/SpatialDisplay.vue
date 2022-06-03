<template>
  <div>
    <v-navigation-drawer
    v-model="drawer"
    app
    clipped
    hide-overlay
    :right="$vuetify.rtl"
    width="320"
    class="view-sidebar"
    >
      <v-toolbar dense flat>
        <v-btn-toggle
          v-model="viewMode"
          color="primary"
          dense
          group
          mandatory
        >
          <v-btn text><v-icon>mdi-file-tree</v-icon></v-btn>
          <v-btn text><v-icon>mdi-view-week</v-icon></v-btn>
        </v-btn-toggle>
      </v-toolbar>
      <v-divider />
      <TreeMenu
        v-if="viewMode === 0"
        :active.sync="active"
        :items="items"
        :open.sync="open"
      >
      </TreeMenu>
      <ColumnMenu
        v-else
        :active.sync="active"
        :items="items"
        :open.sync="open"
      >
      </ColumnMenu>
    </v-navigation-drawer>
    <v-main style="overflow-y: auto; height: 100%">
      <div style="height: calc(100% - 48px);">
        <MapComponent :layer="layerOptions"/>
      </div>
      <DateTimeSlider
        class="date-time-slider"
        v-model="currentTime"
        :dates="times"
        @update:now="setCurrentTime"
      >
        <template slot="prepend">
          <v-btn icon @click="toggleDrawer">
            <v-icon>{{ drawerIcon }}</v-icon>
          </v-btn>
        </template>
      </DateTimeSlider>
    </v-main>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import WMSMixin from '@/mixins/WMSMixin'
import MapComponent from '@/components/MapComponent.vue'
import { ColumnItem } from '@/components/ColumnItem'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import { DateController } from '@/lib/TimeControl/DateController'

@Component({
  components: {
    ColumnMenu,
    TreeMenu,
    DateTimeSlider,
    MapComponent,
  }
})
export default class SpatialDisplay extends Mixins(WMSMixin) {
  @Prop({ default: '' })
  layerName!: string

  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  drawer = true
  viewMode = 0
  dateController!: DateController
  currentTime: Date = new Date()
  times: Date[] = []

  created (): void {
    this.dateController = new DateController([])
  }

  mounted (): void {
    this.loadCapabilities()
    this.onLayerChange()
  }

  async loadCapabilities (): Promise<void> {
    const response = await fetch('https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/wms?request=GetCapabilities&format=application/json&onlyHeaders=true')
    const capabilities = await response.json()
    const layers = capabilities.layers
    const groupNames = [...new Set(layers.map((l: any) => l.groupName))]
    const items: ColumnItem[] = [
      {
        id: 'root',
        name: 'Layers',
      }
    ]
    items[0].children = []
    for (const groupName of groupNames) {
      const group = layers.find((l: any) => l.groupName === groupName)
      const children = []
      for (const layer of layers.filter((l: any) => l.groupName === groupName)) {
        children.push({
          id: layer.name,
          name: layer.title || layer.name,
          to: {
            name: 'SpatialDisplay',
            params: {
              layerName: layer.name,
            }
          }
        })
      }
      items[0].children.push({ id: group.groupName, name: group.groupTitle, children })
    }
    this.items = items
    this.open = [items[0].id]
  }

  setCurrentTime (): void {
    this.dateController.selectDate(new Date())
    this.currentTime = this.dateController.currentTime
  }

  @Watch('layerName')
  async onLayerChange (): Promise<void> {
    this.times = await this.getTimes(this.layerName)
    this.dateController.dates = this.times
    this.dateController.selectDate(this.currentTime)
    this.currentTime = this.dateController.currentTime
  }

  toggleDrawer (): void {
    this.drawer = !this.drawer
  }

  get drawerIcon (): string {
    return this.drawer ? 'mdi-chevron-double-left' : 'mdi-chevron-double-right'
  }

  get layerOptions (): any {
    if (this.layerName) return { name: this.layerName, time: this.currentTime }
    return {}
  }
}
</script>
