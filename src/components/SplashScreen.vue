<template>
  <v-dialog v-model="showDialog" max-width="900" persistent>
    <v-card>
      <v-img :src="splashUrl" />
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showDialog = false">I ACCEPT</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class SplashScreen extends Vue {
  showDialog: boolean = true
  splashUrl: string = `${process.env.BASE_URL}images/splash.png`
}
</script>
