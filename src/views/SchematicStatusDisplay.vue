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
        :src="`${baseUrl}/ssd?request=GetDisplay&ssd=${panelId}`">
      </SSDComponent>
    </div>
    <DateTimeSlider class="date-time-slider">
    </DateTimeSlider>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import SSDComponent from '@/components/SsdComponent.vue'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import { ColumnItem } from '@/components/ColumnItem'

@Component({
  components: {
    ColumnMenu,
    DateTimeSlider,
    SSDComponent,
    TreeMenu,
  }
})
export default class SsdView extends Vue {
  @Prop({ default: '', type: String })
  panelId!: string

  @Prop({ default: '', type: String })
  groupId! : string

  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0
  baseUrl = ''

  created (): void {
    this.baseUrl = this.$config.get<string>('VUE_APP_FEWS_WEBSERVICES_URL')
  }

  mounted (): void {
    this.loadCapabilities()
  }

  async loadCapabilities (): Promise<void> {
    const response = await fetch(`${this.baseUrl}/ssd?request=GetCapabilities&format=application/json`)
    const capbilities = await response.json()
    console.log(capbilities)
    const items: ColumnItem[] = [
      {
        id: 'root',
        name: 'Overzichtschermen',
      }
    ]
    items[0].children = []
    for (const displayGroup of capbilities.displayGroups) {
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
    this.items = items
    this.open = [items[0].id]
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
