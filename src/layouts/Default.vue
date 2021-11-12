<template>
  <v-app id="app">
    <v-app-bar color="primary"
      dense
      app
      dark
      :clipped-left="!this.$vuetify.rtl"
      :clipped-right="this.$vuetify.rtl"
      src="water_pattern_by_nemaakos-d5n2v50.jpg"
    >
      <template v-slot:img="{ props }">
        <v-img
          v-bind="props"
          gradient="to top right, rgba(19,84,122,.9), rgba(8,51,101,.9)"
        ></v-img>
      </template>
      <v-app-bar-nav-icon aria-label="Menu button" @click="drawer = !drawer" />
      <v-toolbar-title>Delft-FEWS Web OC</v-toolbar-title>
      <v-spacer />
      <img src="@/assets/images/deltares_logo.png" alt="Deltares" contain height="38px" />
      <login-component />
    </v-app-bar>
    <v-navigation-drawer
      v-model="drawer"
      class="navbar"
      app
      clipped
      hide-overlay
      :right="this.$vuetify.rtl"
      width="320"
      >
        <v-list>
          <v-list-item to="/">
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              Home
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/map">
            <v-list-item-icon>
              <v-icon>mdi-map</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              WMS layers
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/ssd">
            <v-list-item-icon>
              <v-icon>mdi-application-brackets-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              Schematic Status Display
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/display">
            <v-list-item-icon>
              <v-icon>mdi-chart-line</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              Time Series Display
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    <v-main style="overflow-y: auto;">
      <router-view/>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import LoginComponent from '@/components/LoginComponent.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({ components: { LoginComponent } })
export default class Home extends Vue {
  drawer: boolean | null = null

  mounted (): void {
    console.log('app')
  }
}
</script>

<style lang="scss">
html {
  overflow-y: auto;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.navbar {
  background-image: linear-gradient(to bottom, rgba(240, 240, 240, 0.99), rgba(240, 240, 240,0.98));
}

</style>
