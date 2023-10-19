<template>
  <v-dialog v-model="showDialog" max-width="900" @click:outside="showDialog = false">
    <v-img :src="splashUrl" @click="showDialog = false"/>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class SplashScreen extends Vue {
  showDialog: boolean = true
  splashUrl: string = `${process.env.BASE_URL}splash.png`
}
</script>
