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
    <v-main style="overflow-y: auto;">
      <SSDComponent src="https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/ssd?request=GetDisplay&ssd=Overzichtsscherm_WMCN"
    />
    </v-main>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import SSDComponent from '@/components/SsdComponent.vue'
import ColumnMenu from '@/components/ColumnMenu.vue'
import { ColumnItem } from '@/components/ColumnItem'

@Component({
  components: {
    SSDComponent,
    ColumnMenu
  }
})
export default class SsdView extends Vue {
  drawer = true
  active = []
  open = []
  items: ColumnItem = []
  viewMode = 0

  mounted () {
    this.loadCapabilities()
  }

  async loadCapabilities () {
    const response = await fetch('capabilities.json')
    const capbilities = await response.json()
    console.log(capbilities)
    const items: ColumnItem = [
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
  onActiveChange () {
    console.log('update:active', this.active)
  }

  @Watch('open')
  onOpenChange () {
    console.log('update:open', this.open)
  }
}
</script>
