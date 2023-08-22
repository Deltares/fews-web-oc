<template>
  <v-app id="app">
    <v-app-bar color="#080C80" density="compact">
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
      <v-spacer />
      <!-- <TimeControl/>
      <CogMenu/> -->
    </v-app-bar>
    <v-navigation-drawer v-model="drawer"  :location="isRtl ? 'right' : 'left'" width="320"
      class="view-sidebar">
      <v-toolbar density="compact" fixed>
        <v-btn variant="text" :to="{ name: 'About' }" class="fews-home">
          <v-img width="148"></v-img>
        </v-btn>
        <v-spacer />
        <v-btn>WK</v-btn>
        <!-- <login-component v-if="$config.authenticationIsEnabled"/> -->
      </v-toolbar>
      <v-menu offset-y left min-width="320">
        <template v-slot:activator="{ isActive, props }">
        <v-list-item
          aria-label="Menu button"
          v-bind="props"
          v-on="isActive"
        >
          <!-- <v-list-item-content>{{ currentItemTitle }}</v-list-item-content> -->
          <v-list-item-icon><v-icon small>{{ isActive ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon></v-list-item-icon>
        </v-list-item>
        </template>
        <v-list density="compact">
          <v-subheader>Switch to</v-subheader>
          <!-- <v-list-item v-for="item in menuItems" :key="item.id" :to="item.to">
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
               {{ item.title }}
            </v-list-item-content>
          </v-list-item> -->
        </v-list>
      </v-menu>
      <portal-target name="web-oc-sidebar" />
    </v-navigation-drawer>
    <v-main id="main">
      <router-view style="height: 100%;">
      </router-view>
      <!-- <div class="alert-div" v-if="showAlerts">
        <div v-for="alert in activeAlerts" v-bind:key="alert.id">
          <v-alert type="error" dismissible @input="(value) => dismissAlert(alert, value)">
            {{ alert.message }}
          </v-alert>
        </div>
      </div> -->
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRtl } from 'vuetify'

const drawer = ref(true)
const { isRtl } = useRtl()


</script>

<style>
html, body {
  margin: 0px;
  overflow: hidden;
  height: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  overflow: hidden;
}

.fews-home.v-btn {
  text-transform: capitalize !important;
}

#app.theme--light {
  background-color: rgba(240, 240, 240, 1);
  color: #2c3e50;
}

#main {
  height: 100%;
  overflow: hidden;
}

.router-container {
  padding: 0px;
  height: 100%;
}

.theme--light .view-sidebar {
  background-image: linear-gradient(to bottom, rgba(240, 240, 240, 1), rgba(240, 240, 240, 1));
}
</style>
