<template>
  <v-layout id="app">
    <v-main id="main" class="d-flex align-center justify-center">
      <Suspense>
        <router-view style="height: 100%"> </router-view>
      </Suspense>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'

const currentItem = ref('')
const route = useRoute()

onBeforeMount(async () => {
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
