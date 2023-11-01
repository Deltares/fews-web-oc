<template>
  <v-dialog v-model="showDialog" max-width="900">
    <v-card v-if="!showDisclaimer" @click="showDialog = false">
      <v-img :src="splashUrl" />
      <div class="overlay">
        <div class="black--text">Viewer Version {{packageVersion}}</div>
        <a @click="showDisclaimer = true">Terms of Use</a>
      </div>
    </v-card>
    <DisclaimerText v-else />
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import DisclaimerText from '@/components/DisclaimerText.vue'
import packageConfig from '../../package.json'


@Component({components: {
  DisclaimerText
}})
export default class SplashScreen extends Vue {
  showDialog: boolean = true
  showDisclaimer: boolean = false
  splashUrl: string = `${process.env.BASE_URL}images/splash.png`
  packageVersion = packageConfig.version
}
</script>

<style scoped>
.overlay {
  position: absolute;
  bottom: 12px;
  right: 20px;
  text-align: right;
}
</style>
