<template>
  <div class="web-oc-ssd">
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
    <div style="height: calc(100% - 48px);">
      <SSDComponent
        :src="src">
      </SSDComponent>
    </div>
    <DateTimeSlider class="date-time-slider" v-model="timeIndex" :dates="dates" @input="debouncedUpdate">
    </DateTimeSlider>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import SSDComponent from '@/components/SsdComponent.vue'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import { ColumnItem } from '@/components/ColumnItem'
import SSDMixin from '@/mixins/SSDMixin'
import { debounce } from 'lodash'

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

  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0
  baseUrl = ''
  timeString = ''
  debouncedUpdate!: () => void

  async created (): Promise<void> {
    this.baseUrl = this.$config.get<string>('VUE_APP_FEWS_WEBSERVICES_URL')
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
      return `${this.baseUrl}/ssd?request=GetDisplay&ssd=${this.panelId}&time=${time}`
    }
    return `${this.baseUrl}/ssd?request=GetDisplay&ssd=${this.panelId}`
  }

  @Watch('groupId')
  onGroupIdChange (): void {
    this.selectGroup(this.groupId)
  }

  @Watch('panelId')
  onPanelIdChange (): void {
    this.selectPanel(this.panelId)
  }

  @Watch('active')
  onActiveChange (): void {
    console.log('update:active', this.active)
  }

  @Watch('open')
  onOpenChange (): void {
    console.log('update:open', this.open)
  }
}
</script>

<style>
.web-oc-ssd {
  background-color: white;
}
</style>
