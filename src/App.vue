<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
    </v-app-bar>
    <v-main>
      <MapComponent/>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import MapComponent from './components/MapComponent.vue'

export default Vue.extend({
  name: 'App',

  components: {
    MapComponent
  },

  data: () => ({
    //
  })
})
</script>
