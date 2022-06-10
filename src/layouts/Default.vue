<template>
  <v-app id="app">
    <v-app-bar color="#080C80" dense app dark :clipped-left="!$vuetify.rtl" :clipped-right="$vuetify.rtl">
      <v-app-bar-nav-icon aria-label="Menu button" @click="toggleDrawer()">
      </v-app-bar-nav-icon>
      <v-btn v-if="!$vuetify.breakpoint.mobile" text to="/home">Delft-FEWS Web OC</v-btn>
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn aria-label="Menu button" v-bind="attrs" v-on="on" text>
            <v-icon style="margin-right: 20px">{{ menuIcon }}</v-icon>
            {{ menuLabel }}
            <v-icon style="margin-left: 10px" small>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item v-for="item in menuItems" :key="item.id" :to="item.to">
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              {{item.id}}
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-spacer />
      <login-component />
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" app clipped hide-overlay :right="$vuetify.rtl" width="320"
      class="view-sidebar">
      <v-list v-if="!$route.meta.sidebar" dense>
        <v-list-item v-for="item in menuItems" :key="item.id" :to="item.to">
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            {{item.id}}
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <portal-target v-else name="web-oc-sidebar" />
    </v-navigation-drawer>
    <v-main>
      <router-view style="height: 100%;" />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import LoginComponent from '@/components/LoginComponent.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({ components: { LoginComponent } })
export default class Home extends Vue {
  drawer: boolean | null = null
  menuItems= [
    { id: 'Overview', icon: 'mdi-apps', to: { name: 'Home' } },
    { id: 'Schematic Status Display', icon: 'mdi-application-brackets-outline', to: { name: 'SchematicStatusDisplay', params: { groupId: '0', panelId: '0' } } },
    { id: 'Spatial Display', icon: 'mdi-map', to: { name: 'SpatialDisplay', params: { layerName: '0' } } },
    { id: 'Time Series Display', icon: 'mdi-chart-sankey', to: { name: 'TimeSeriesDisplay' } },
    { id: 'Explore Archive', icon: 'mdi-archive-search', to: { name: 'Explore' } },
    { id: 'Tasks', icon: 'mdi-clipboard-list', to: { name: 'Tasks' } },
  ]

  toggleDrawer (): void {
    this.drawer = !this.drawer
  }

  get menuLabel (): string {
    return this.menuItems.find((item) => item.to.name === this.$route.name)?.id || ''
  }

  get menuIcon (): string {
    return this.menuItems.find((item) => item.to.name === this.$route.name)?.icon || ''
  }
}
</script>

<style>
html {
  overflow-y: auto;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: rgba(240, 240, 240, 1);
}

.view-sidebar {
  background-image: linear-gradient(to bottom, rgba(240, 240, 240, 1), rgba(240, 240, 240, 1));
}
</style>
