<template>
  <v-layout id="app">
    <v-main id="main">
      <v-sheet class="w-100 h-100">
        <Suspense>
          <router-view :hasAppBar="false" :hasSideBar="false" />
        </Suspense>
      </v-sheet>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { useCustomStyleSheet } from '@/services/useCustomStyleSheet'

useCustomStyleSheet()
</script>

<style scoped>
html,
body {
  margin: 0px;
  overflow: hidden;
  height: 100%;
}

#app {
  height: 100%;
  overflow: hidden;
}
</style>
