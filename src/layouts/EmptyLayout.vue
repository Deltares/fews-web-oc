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
import { onBeforeMount, ref, watch } from 'vue'
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
