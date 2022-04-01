<template>
  <v-app id="app">
    <v-app-bar color="primary"
      dense
      app
      dark
      :clipped-left="!$vuetify.rtl"
      :clipped-right="$vuetify.rtl"
      src="@/assets/images/water_pattern_by_nemaakos-d5n2v50.jpg"
    >
      <template v-slot:img="{ props }">
        <v-img
          v-bind="props"
          gradient="to top right, rgba(19,84,122,.9), rgba(8,51,101,.9)"
        ></v-img>
      </template>
      <v-btn text depressed to="/home" class="home-title">Delft-FEWS Web OC</v-btn>
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
        <v-app-bar-nav-icon
          aria-label="Menu button"
          v-bind="attrs"
          v-on="on"
        >
        </v-app-bar-nav-icon>
        </template>
        <v-list dense>
          <v-list-item to="/current">
            <v-list-item-icon>
              <v-icon>mdi-chili-alert</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              Current Status
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/explore">
            <v-list-item-icon>
              <v-icon>mdi-archive-search</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              Explore Archive
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/ssd">
            <v-list-item-icon>
              <v-icon>mdi-application-brackets-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              Schematic Status Displays
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/tasks">
            <v-list-item-icon>
              <v-icon>mdi-clipboard-list</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              Tasks
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/display">
            <v-list-item-icon>
              <v-icon>mdi-application-cog</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              System
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/help">
            <v-list-item-icon>
              <v-icon>mdi-help-circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              Help
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-spacer />
      <v-btn depressed text to="/current">
        <v-icon>mdi-chili-alert</v-icon>
        <v-chip small color="warning">1</v-chip>
      </v-btn>
      <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          depressed
          text
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>mdi-clipboard-list</v-icon>
          <v-chip small>2</v-chip>
          <v-icon small>mdi-chevron-down</v-icon>
        </v-btn>
        </template>
        <v-list dense>
          <v-list-item to="/tasks">
            Tasks
          </v-list-item>
          <v-divider />
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>Task #1</v-list-item-title>
              <v-progress-linear :value="50" color="green"></v-progress-linear>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>Task #2</v-list-item-title>
              <v-progress-linear indeterminate color="green"></v-progress-linear>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            depressed
            text
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-help-circle</v-icon>
            <v-chip small>1</v-chip>
            <v-icon small>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item>
            <v-list-item-title>
            New
            </v-list-item-title>
          <v-list-item-avatar><v-chip small>1</v-chip></v-list-item-avatar>
          </v-list-item>
          <v-divider />
          <v-list-item>Help</v-list-item>
        </v-list>
      </v-menu>
      <login-component />
    </v-app-bar>
    <router-view style="height: 100%;"/>
  </v-app>
</template>

<script lang="ts">
import LoginComponent from '@/components/LoginComponent.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({ components: { LoginComponent } })
export default class Home extends Vue {
  drawer: boolean | null = null
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
}

.view-sidebar {
  background-image: linear-gradient(to bottom, rgba(240, 240, 240, 1), rgba(240, 240, 240, 1));
}

.home-title {
  text-transform: capitalize;
}
</style>
