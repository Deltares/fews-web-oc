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
      <TreeMenu
        v-if="viewMode === 0 && !$vuetify.breakpoint.mobile"
        :active.sync="active"
        :items="items"
        :open.sync="open"
      />
      <ColumnMenu
        v-else
        rootName="Overzichtsschermen"
        :active.sync="active"
        :items="items"
        :open.sync="open"
      />
    </portal>
    <div class="grid-map" v-show="showMap">
      <div style="height: calc(100% - 48px)">
        <SSDComponent v-if="src!==''" @action="onAction" :src="src" :fitWidth="fitWidth">
        </SSDComponent>
      </div>
      <DateTimeSlider class="date-time-slider" v-model="timeIndex" :dates="dates" @input="debouncedUpdate" @update:now="updateFollowNow">
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
      <router-view @toggleFullscreen="toggleFullscreen">
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
import { ActionType, Result } from '@deltares/fews-ssd-requests'
import { namespace } from 'vuex-class'
import { Alert } from '@/store/modules/alerts/types'

const alertsModule = namespace('alerts')

function absoluteUrl(urlString: string): URL {
  let url!: URL
  try {
    url = new URL(urlString)
  } catch (error) {
    if (error instanceof TypeError) {
      url = new URL(urlString, document.baseURI)
    }
  }
  return url
}

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

  @alertsModule.Mutation('addAlert')
    addAlert!: (alert: Alert) => void

  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  // currentObjectId: string = ''
  viewMode = 0
  webServicesUrl = ''
  fitWidth = true
  isFullscreenGraph = false

  timeString = ''
  debouncedUpdate!: () => void
  restoreSelectedTime: boolean = true
  autoRefreshFunction: number = -1
  autoRefreshInterval: number = 2 * 60 * 1000

  layoutClass = 'right'
  dockMode = 'right'

  async created (): Promise<void> {
    this.webServicesUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    this.debouncedUpdate = debounce(this.setTime, 500, { leading: true, trailing: true })
    this.autoRefreshFunction = setInterval(() => {this.updatePanel()}, this.autoRefreshInterval)
  }

  async mounted (): Promise<void> {
    await this.loadCapabilities()
    this.fillItems()
    this.onGroupIdChange()
    this.onPanelIdChange()
  }

  fillItems (): void {
    const items: ColumnItem[] = []
    if (this.capabilities !== undefined) {
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
        items.push({ id: displayGroup.name, name, children })
      }
    }
    this.items = items
    this.open = [items[0].id]
    if (this.groupId === "" || this.panelId === "") {
      const groupId = this.capabilities.displayGroups[0].name
      const panelId = this.capabilities.displayGroups[0].displayPanels[0].name
      if (groupId !== undefined && panelId !== undefined) {
        this.$router.push({
          name: 'SchematicStatusDisplay',
          params: { groupId, panelId },
          query: this.$route.query
        })
      }
    }
  }

  setTime (): void {
    if (this.timeIndex !== null) {
      this.timeString = this.timeIndex.toISOString()
    } else {
      this.timeString = ''
    }
  }

  updateFollowNow (followDefault: boolean) {
    this.restoreSelectedTime = followDefault
    if (this.restoreSelectedTime && this.autoRefreshFunction < 0) {
      this.autoRefreshFunction = setInterval(() => {this.updatePanel()}, this.autoRefreshInterval)
    } else if (!this.restoreSelectedTime && this.autoRefreshFunction > 0) {
      clearInterval(this.autoRefreshFunction)
      this.autoRefreshFunction = -1
    }
    this.setSelectedTime()
  }

  setSelectedTime () {
    if (this.timeIndex === null || this.restoreSelectedTime) {
      this.setTimeIndex()
    } else {
      this.timeIndex = this.findClosestDate(this.timeIndex, this.dates)
    }
  }

  findClosestDate (date: Date, dates: Date[]): Date {
    let index = dates.findIndex((d) => {
      return d >= date
    })
    if (index === -1) {
      index = date < dates[0] ? 0 : dates.length - 1
    }
    return dates[index]
  }

  get src (): string {
    if (this.timeIndex !== null) {
      const time = this.timeIndex.toISOString().replace(/.\d+Z$/g, 'Z')
      return absoluteUrl(`${this.webServicesUrl}/ssd?request=GetDisplay&ssd=${this.panelId}&time=${time}`).toString()
    }
    if (this.panelId !== '') {
      return absoluteUrl(`${this.webServicesUrl}/ssd?request=GetDisplay&ssd=${this.panelId}`).toString()
    }
    return ''
  }

  async updatePanel () {
    await this.loadCapabilities()
    this.selectGroup(this.groupId)
    this.selectPanel(this.panelId)
    this.setSelectedTime()
  }

  @Watch('groupId')
  onGroupIdChange (): void {
    this.selectGroup(this.groupId)
    Vue.set(this.open, 1, this.groupId)
  }

  @Watch('panelId')
  onPanelIdChange (): void {
    this.selectPanel(this.panelId)
    // Set time to preserve restoreSelectedTime
    this.setSelectedTime()
    // Update the panel, which sets the time again
    this.updatePanel()
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
    const now: Date = new Date()
    if (results.length === 0) {
      this.addAlert({ id: `undefined-action-${now.toISOString()}`, message: "No left click actions defined for this object", active: true})
      throw new Error('No left click actions defined for this object')
    }
    switch (results[0].type) {
      case (ActionType.PI):
        this.openTimeSeriesDisplay(panelId, objectId)
        break
      case (ActionType.URL):
        this.actionUrl(new URL(results[0].requests[0].request))
        break
      case (ActionType.PDF):
        this.actionUrl(new URL(results[0].requests[0].request))
        break
      case (ActionType.SSD):
        this.switchPanel(results[0].requests[0].request)
        break
      default:
        this.addAlert({ id: `action-${results[0].type}-${now.toISOString()}`, message: `Action '${results[0].type}' not supported yet.`, active: true})
    }
  }

  actionUrl(url: URL) {
    window.open(url.toString())
  }

  switchPanel (request: string) {
    const url = absoluteUrl(this.webServicesUrl + request)
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
    this.$router.push( {name: 'SSDTimeSeriesDisplay', params: { objectId: objectId, panelId: panelId, groupId: this.groupId }} )
  }

  closeCharts (): void {
    if (this.objectId) {
      this.$router.push({ name: 'SchematicStatusDisplay', params: { groupId: this.groupId, panelId: this.panelId }})
    }
  }

  toggleFullscreen(isFullscreen: boolean) {
    this.isFullscreenGraph = isFullscreen
  }

  get hasSelectedLocation() {
    return this.objectId !== ''
  }

  get showMap() {
    const isMobileGraphOpen = this.hasSelectedLocation && this.$vuetify.breakpoint.mobile
    return !isMobileGraphOpen && !this.isFullscreenGraph
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
    console.log('mobile', this.$vuetify.breakpoint.mobile )
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

  beforeDestroy () {
    clearInterval(this.autoRefreshFunction)
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
