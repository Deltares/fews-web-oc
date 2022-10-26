<template>
  <v-app id="app">
    <v-app-bar color="#080C80" dense app dark :clipped-left="!$vuetify.rtl" :clipped-right="$vuetify.rtl">
      <v-btn v-if="!$vuetify.breakpoint.mobile" text to="/home">Delft-FEWS Web OC</v-btn>
      <v-tabs
        show-arrows
      >
      <v-tab v-for="item in menuItems" :key="item.id" :to="item.to">
        <div style="width: 200px;">
          <v-icon style="padding-right: 10px;">{{ item.icon }}</v-icon>
          {{ item.id }}
        </div>
      </v-tab>
      </v-tabs>
      <v-spacer />
      <login-component v-if="$config.authenticationIsEnabled"/>
    </v-app-bar>
    <v-navigation-drawer v-if="$route.meta.sidebar" v-model="drawer" app clipped hide-overlay :right="$vuetify.rtl" width="320"
      class="view-sidebar">
      <portal-target name="web-oc-sidebar" />
    </v-navigation-drawer>
    <v-main>
      <v-btn v-if="$route.meta.sidebar && !($vuetify.breakpoint.mobile && drawer) " @click="toggleDrawer()" style="position: absolute; left: 0px; top: calc(50% - 18px); overflow: hidden-x; width: 30px;z-index: 90000; border-bottom-left-radius: 0px; border-top-left-radius: 0px; padding: 0px; min-width: 30px;">
        <v-icon aria-label="Menu button">{{ drawer ? 'mdi-chevron-left' : 'mdi-chevron-right' }} </v-icon>
      </v-btn>
      <router-view style="height: 100%;">
      </router-view>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import LoginComponent from '@/components/LoginComponent.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({ components: { LoginComponent } })
export default class Home extends Vue {
  drawer: boolean | null = null
  menuItems = [
    { id: 'Data View', icon: 'mdi-archive-search', to: { name: 'DataView' } },
    { id: 'Schematic Status Display', icon: 'mdi-application-brackets-outline', to: { name: 'SchematicStatusDisplay' } },
    { id: 'Spatial Display', icon: 'mdi-map', to: { name: 'SpatialDisplay' } },
    { id: 'Time Series Display', icon: 'mdi-chart-sankey', to: { name: 'TimeSeriesDisplay' } },
    { id: 'System monitor', icon: 'mdi-clipboard-list', to: { name: 'SystemMonitor' } },
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
