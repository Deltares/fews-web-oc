<template>
  <div>
    <v-navigation-drawer
    v-model="drawer"
    app
    absolute
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
      <v-treeview
        v-if="viewMode === 0"
        :active.sync="active"
        :items="items"
        :open.sync="open"
        activatable
        open-on-click
        transition
      >
      </v-treeview>
      <ColumnMenu
        v-else
        :active.sync="active"
        :items="items"
        :open.sync="open"
      >
      </ColumnMenu>
    </v-navigation-drawer>
    <v-main style="overflow-y: auto; height: 100%">
      <div style="height: calc(100% - 52px);">
      <SSDComponent src="https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/ssd?request=GetDisplay&ssd=Overzichtsscherm_WMCN">
      </SSDComponent>
      </div>
      <DateTimeSlider class="date-time-slider">
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
import { Component, Vue, Watch } from 'vue-property-decorator'
import SSDComponent from '@/components/SsdComponent.vue'
import ColumnMenu from '@/components/ColumnMenu.vue'
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import { ColumnItem } from '@/components/ColumnItem'

@Component({
  components: {
    ColumnMenu,
    DateTimeSlider,
    SSDComponent,
  }
})
export default class SsdView extends Vue {
  drawer = true
  active = []
  open = []
  items: ColumnItem[] = []
  viewMode = 0

  mounted (): void {
    this.loadCapabilities()
  }

  async loadCapabilities (): Promise<void> {
    const response = await fetch('https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/ssd?request=GetCapabilities&format=application/json')
    const capbilities = await response.json()
    console.log(capbilities)
    const items: ColumnItem[] = [
      {
        id: 'root',
        name: 'Overzichtschermen',
        children: []
      }
    ]
    for (const displayGroup of capbilities.displayGroups) {
      const name = displayGroup.title.replace('Overzichtsschermen ', '')
      const children = []
      for (const displayPanel of displayGroup.displayPanels) {
        children.push({ id: displayPanel.name, name: displayPanel.title })
      }
      items[0].children.push({ id: displayGroup.name, name, children })
    }
    this.items = items
    console.log(items)
  }

  @Watch('active')
  onActiveChange (): void {
    console.log('update:active', this.active)
  }

  @Watch('open')
  onOpenChange (): void {
    console.log('update:open', this.open)
  }

  toggleDrawer (): void {
    this.drawer = !this.drawer
  }

  get drawerIcon (): string {
    return this.drawer ? 'mdi-chevron-double-left' : 'mdi-chevron-double-right'
  }
}
</script>
