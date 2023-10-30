<template>
  <v-dialog v-model="showDialog" max-width="900">
    <v-card v-if="!showDisclaimer" @click="showDialog = false">
      <v-img :src="splashUrl" />
      <a class="terms-of-use-link" @click="showDisclaimer = true">Terms of Use</a>
    </v-card>
    <DisclaimerText v-else />
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import DisclaimerText from '@/components/DisclaimerText.vue'

@Component({components: {
  DisclaimerText
}})
export default class SplashScreen extends Vue {
  showDialog: boolean = true
  showDisclaimer: boolean = false
  splashUrl: string = `${process.env.BASE_URL}images/splash.png`
}
</script>

<style scoped>
.terms-of-use-link {
  position: absolute;
  bottom: 12px;
  right: 20px;
}
</style>
