<template>
  <div class="web-oc-ssd grid-root" :class="layoutClass">
    <portal to="web-oc-sidebar">
      <v-toolbar dense flat v-if="!$vuetify.breakpoint.mobile">
        <v-btn-toggle v-model="viewMode" color="primary" dense group mandatory>
          <v-btn text>
            <v-icon>mdi-file-tree</v-icon>
          </v-btn>
          <v-btn text>
            <v-icon>mdi-view-week</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-toolbar>
      <v-divider />
      <TreeMenu v-if="viewMode === 0 && !$vuetify.breakpoint.mobile" :active.sync="active" :items="items"
        :open.sync="open">
      </TreeMenu>
      <ColumnMenu v-else :active.sync="active" :items="items" :open.sync="open">
      </ColumnMenu>
    </portal>
    <div class="grid-map" v-show="true">
      <div style="height: calc(100% - 48px)">
        <SSDComponent @action="onAction" :src="src" :fitWidth="fitWidth">
        </SSDComponent>
      </div>
      <DateTimeSlider class="date-time-slider" v-model="timeIndex" :dates="dates" @input="debouncedUpdate">
        <template v-if="!$vuetify.breakpoint.mobile" v-slot:append>
          <v-btn icon @click="fitWidth = !fitWidth">
            <v-icon>{{iconFitButton}} </v-icon>
          </v-btn>
        </template>
      </DateTimeSlider>
    </div>
    <div class="grid-charts" ref="grid-charts" v-if="objectId !== ''">
      <v-toolbar dense flat style="flex: 0 0 auto;">
        <v-toolbar-title>
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn-toggle tile group>
            <v-btn disabled v-if="!$vuetify.breakpoint.mobile" icon plain @click="openTimeSeriesWindow()">
              <v-icon>mdi-dock-window</v-icon>
            </v-btn>
            <v-btn v-if="!$vuetify.breakpoint.mobile" icon plain @click="onDockModeChange('left')">
              <v-icon>mdi-dock-left</v-icon>
            </v-btn>
            <v-btn v-if="!$vuetify.breakpoint.mobile" icon plain @click="onDockModeChange('right')">
              <v-icon>mdi-dock-left</v-icon>
            </v-btn>
            <v-btn icon plain @click="closeCharts">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-toolbar-items>
      </v-toolbar>
      <router-view>
      </router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch, Vue } from 'vue-property-decorator'
import SSDComponent from '@/components/SsdComponent.vue'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import { ColumnItem } from '@/components/ColumnItem'
import SSDMixin from '@/mixins/SSDMixin'
import { debounce } from 'lodash'
import { Result } from '@deltares/fews-ssd-requests'

@Component({
  components: {
    ColumnMenu,
    DateTimeSlider,
    SSDComponent,
    TreeMenu,
  }
})
export default class SsdView extends Mixins(SSDMixin) {
  @Prop({ default: '', type: String })
    panelId!: string

  @Prop({ default: '', type: String })
    groupId! : string

  @Prop({ default: '', type: String })
    objectId! : string

  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  // currentObjectId: string = ''
  viewMode = 0
  webServicesUrl = ''
  fitWidth = true

  timeString = ''
  debouncedUpdate!: () => void

  layoutClass = 'right'
  dockMode = 'right'

  async created (): Promise<void> {
    this.webServicesUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    this.debouncedUpdate = debounce(this.setTime, 500, { leading: true, trailing: true })
  }

  async mounted (): Promise<void> {
    await this.loadCapabilities()
    this.onGroupIdChange()
    this.onPanelIdChange()
  }

  @Watch('capabilities')
  fillItems (): void {
    const items: ColumnItem[] = [
      {
        id: 'root',
        name: 'Overzichtschermen',
      }
    ]
    if (this.capabilities !== undefined) {
      items[0].children = []
      for (const displayGroup of this.capabilities.displayGroups) {
        const name = displayGroup.title.replace('Overzichtsschermen ', '')
        const children = []
        for (const displayPanel of displayGroup.displayPanels) {
          children.push({
            id: displayPanel.name,
            name: displayPanel.title,
            to: {
              name: 'SchematicStatusDisplay',
              params: {
                panelId: displayPanel.name,
                groupId: displayGroup.name
              }
            }
          })
        }
        items[0].children.push({ id: displayGroup.name, name, children })
      }
    }
    this.items = items
    this.open = [items[0].id]
    if (this.groupId === "") {
      const groupId = this.capabilities.displayGroups[0].name
      const panelId = this.capabilities.displayGroups[0].displayPanels[0].name
      this.$router.push({
        name: 'SchematicStatusDisplay',
        params: { groupId, panelId },
        query: this.$route.query
      })
    }
  }

  setTime (): void {
    if (this.timeIndex !== null) {
      this.timeString = this.timeIndex.toISOString()
    } else {
      this.timeString = ''
    }
  }

  get src (): string {
    if (this.timeIndex !== null) {
      const time = this.timeIndex.toISOString().replace(/.\d+Z$/g, 'Z')
      return `${this.webServicesUrl}/ssd?request=GetDisplay&ssd=${this.panelId}&time=${time}`
    }
    return `${this.webServicesUrl}/ssd?request=GetDisplay&ssd=${this.panelId}`
  }

  @Watch('groupId')
  onGroupIdChange (): void {
    this.selectGroup(this.groupId)
    Vue.set(this.open, 1, this.groupId)
  }

  @Watch('panelId')
  onPanelIdChange (): void {
    this.selectPanel(this.panelId)
    Vue.set(this.open, 2, this.panelId)
    this.active = [this.panelId]
  }

  @Watch('objectId')
  onObjectIdChange(newObjectId: string, oldObjectId: string) {
    if (newObjectId === '' || oldObjectId === '') {
      this.onResize()
    }
  }

  @Watch('active')
  onActiveChange (newValue: string[], oldValue: string[]): void {
    if (newValue.length === 0) this.active = oldValue
  }

  onAction (event: CustomEvent<{ objectId: string, panelId: string, results: Result[]}>): void {
    const { panelId, objectId, results } = event.detail
    if (results.length === 0) {
      throw new Error('No left click actions defined for this object')
    }
    if (results[0].type === 'PI') { this.openTimeSeriesDisplay(panelId, objectId) }
    if (results[0].type === 'URL') { this.actionUrl(new URL(results[0].requests[0].request)) }
    if (results[0].type === 'PDF') { this.actionUrl(new URL(results[0].requests[0].request)) }
    if (results[0].type === 'SSD') { this.switchPanel(results[0].requests[0].request) }
  }

  actionUrl(url: URL) {
    window.open(url.toString())
  }

  switchPanel (request: string) {
    const url = new URL(this.webServicesUrl + request)
    const panelId = url.searchParams.get('ssd')
    if (panelId) {
      const group = this.capabilities.displayGroups.find((g) => {
        const index = g.displayPanels.findIndex((panel) => {
          return panel.name === panelId
        })
        return index > -1
      })
      const groupId = group?.name
      if (groupId) {
        const index = this.excludedGroupsNames.findIndex((name:string) => {
          return name === groupId
        })
        if (index === -1) {
          this.$router.push({
            name: 'SchematicStatusDisplay',
            params: { groupId, panelId },
            query: this.$route.query
          }).finally(() => { document.title = `${this.currentPanel.title}` })
        }
      }
    }
  }

  openTimeSeriesDisplay(panelId: string, objectId: string) {
    this.$router.push( {name: 'SSDTimeSeriesDisplay', params: { objectId, panelId, groupId: this.groupId  }} )
  }

  closeCharts (): void {
    if (this.objectId) {
      this.$router.push({ name: 'SchematicStatusDisplay', params: { groupId: this.groupId, panelId: this.panelId }})
    }
  }

  setLayoutClass(): void {
    if (this.$vuetify.breakpoint.mobile) {
      this.layoutClass = 'mobile'
    } else {
      this.onDockModeChange(this.dockMode)
    }
  }

  @Watch('$vuetify.breakpoint.mobile')
  onBreakpointChange (): void {
    this.setLayoutClass()
  }

  @Watch('layoutClass')
  onResize(): void {
    window.dispatchEvent(new Event('resize'))
  }

  @Watch('objectId')
  @Watch('dockMode')
  changeLayout(): void {
    if (this.objectId) {
      console.log(this.objectId, this.dockMode, this.layoutClass)
      if (this.layoutClass !== this.dockMode) {
        this.layoutClass = this.dockMode
      }
    }
  }

  onDockModeChange(dockMode: string): void {
    this.dockMode = dockMode
    this.changeLayout()
  }

  get iconFitButton() {
    return this.fitWidth ? 'mdi-fit-to-page' : 'mdi-fit-to-screen'
  }
}
</script>

<style scoped>
.theme--light .web-oc-ssd {
  background-color: white;
}

.grid-map > .date-time-slider {
  position: absolute;
  bottom: 0px;
  width: 100%;
}

.grid-root {
  display: flex;
}

.grid-root.right {
  height: 100%;
  flex-direction: row;
}

.grid-root.left {
  height: 100%;
  flex-direction: row-reverse;
}

.grid-root.bottom {
  flex-direction: column;
}

.grid-map {
  position: relative;
  display: flex;
  max-width: 100%;
  flex: 1 1 0px;
  flex-direction: column;
}

.bottom > .grid-map {
  height: 400px;
  width: 100%;
}

.grid-charts {
  display: none;
  overflow: hidden;
  width: 100%;
  flex: 1 1 0px;
  flex-direction: column;
}

.mobile > .grid-charts {
  display: flex;
  height: 100%;
  width: 100%;
}

.right > .grid-charts,
.left > .grid-charts {
  display: flex;
  height: 100%;
  width: 50%;
}

.right > .grid-charts {
  right: 0px;
}

.left > .grid-charts {
  left: 0px;
}

.bottom > .grid-charts {
  display: flex;
  height: 400px;
  width: 100%;
  flex: 1 1 auto;
}

.grid-charts-footer {
  width: 100%;
  padding: 10px 10px 0px 10px;
  display: flex;
  flex-direction: row;
}
</style>
