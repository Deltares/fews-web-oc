<template>
  <v-layout id="app">
    <v-navigation-drawer
      v-model="drawer"
      :location="isRtl ? 'right' : 'left'"
      width="320"
      class="view-sidebar"
    >
      <v-toolbar density="compact" fixed>
        <v-btn
          variant="text"
          width="140px"
          :to="{ name: 'About' }"
          class="fews-home"
        >
          <v-img width="130px" :src="defaultLogo"></v-img>
        </v-btn>
        <v-spacer />
      </v-toolbar>
      <v-menu offset-y left min-width="320">
        <template #activator="{ isActive, props }">
          <v-list-item aria-label="Menu button" v-bind="props">
            <v-list-item-title>{{ currentItem }}</v-list-item-title>
            <template #append>
              <v-icon
                :icon="isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              ></v-icon>
            </template>
          </v-list-item>
        </template>
        <v-list density="compact">
          <v-list-subheader>Switch to</v-list-subheader>
          <v-list-item
            v-for="(item, i) in store.activeComponents"
            :key="i"
            :value="item"
            :to="item.to"
          >
            <template v-slot:prepend>
              <v-icon :icon="item.icon"></v-icon>
            </template>
            <v-list-item-title v-text="item.title"></v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <div id="web-oc-sidebar-target"></div>
    </v-navigation-drawer>
    <v-app-bar color="#080C80" density="compact">
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      <v-spacer />
      <v-btn variant="text" icon="mdi-dots-vertical"></v-btn>
    </v-app-bar>

    <v-main id="main" class="d-flex align-center justify-center">
      <Suspense>
        <router-view style="height: 100%"> </router-view>
      </Suspense>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRtl } from 'vuetify'
import { useConfigStore } from '../stores/config.ts'
import { onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'

const store = useConfigStore()
const drawer = ref(true)
const currentItem = ref('')
const { isRtl } = useRtl()
const route = useRoute()
const defaultLogo: string = '/logo.png'

onBeforeMount(async () => {
  console.log('onBeforeMount default')
  currentItem.value = route.name?.toString() ?? ''
})

watch(
  () => route.name,
  async (name) => {
    currentItem.value = name?.toString() ?? ''
  },
)
</script>

<style>
html,
body {
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
