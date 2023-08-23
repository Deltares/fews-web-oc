<template>
  <v-layout id="app">
    <v-navigation-drawer v-model="drawer"  :location="isRtl ? 'right' : 'left'" width="320"
      class="view-sidebar">
      <v-toolbar density="compact" fixed>
        <v-btn variant="text" :to="{ name: 'About' }" class="fews-home">
          <v-img width="148"></v-img>
        </v-btn>
        <v-spacer />
      </v-toolbar>
      <v-menu offset-y left min-width="320">
        <template v-slot:activator="{ isActive, props }">
        <v-list-item
          aria-label="Menu button"
          v-bind="props"
          v-on="isActive"
        >
          <v-list-item-title> Component TBD</v-list-item-title>
          <template v-slot:append>
          <v-icon :icon="isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
        </template>
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
    <v-app-bar color="#080C80" density="compact">
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      <v-spacer />
      <v-btn variant="text" icon="mdi-dots-vertical"></v-btn>
    </v-app-bar>

    <v-main class="d-flex align-center justify-center" id="main">
      <Suspense>
        <router-view style="height: 100%;">
        </router-view>
      </Suspense>
    </v-main>
  </v-layout>
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

#main {
  height: 100%;
  overflow: hidden;
}

.router-container {
  padding: 0px;
  height: 100%;
}
</style>
