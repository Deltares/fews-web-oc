<template>
  <div>
    <v-container>
      <v-row>
        <v-col v-for="(item, index) in items" :key="index" :cols="12" :md="6">
          <v-card>
            <v-card-title :to="item.to">{{ item.title }}
              <v-spacer/>
              <v-btn icon :to="item.to">
                <v-icon>mdi-share</v-icon>
              </v-btn>
            </v-card-title>
            <component :is="item.component" style="height: 300px;">
            </component>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import MapComponent from './MapComponent.vue'
import SsdComponent from './SsdComponent.vue'
import DisplayComponent from './DisplayComponent.vue'

@Component({
  components: {
    MapComponent,
    SsdComponent,
    DisplayComponent
  }
})
export default class Home extends Vue {
  items = [
    {
      title: 'WMS layers',
      to: 'map',
      component: 'map-component'
    },
    {
      title: 'Schematic Status Display',
      to: 'ssd',
      component: 'ssd-component'
    },
    {
      title: 'Time Series Display',
      to: 'display',
      component: 'display-component'
    }
  ]
}
</script>
