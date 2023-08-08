<template>
  <v-app>
    <v-main class="login-container" id="web-oc-login-container-id">
      <div>
        <img src="@/assets/images/deltares_logo.png" alt="Deltares" contain style="max-width: 80%"/>
      </div>
      <h1 style="color: white;">Delft-FEWS Web Operator Client</h1>
      <div class="login-providers">
        <deltares-login name="Deltares"/>
      </div>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import DeltaresLogin from '@/components/DeltaresLogin.vue'
import {PiWebserviceProvider} from "@deltares/fews-pi-requests";

@Component({
  components: {
    DeltaresLogin
  }
})
export default class LoginView extends Vue {
  webServiceUrl: string = ''
  title: string = 'Delft-FEWS Web Operator Client'

  async mounted(): Promise<void> {
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const webServiceProvider = new PiWebserviceProvider(baseUrl)
    this.webServiceUrl = `${baseUrl}${webServiceProvider.API_ENDPOINT}`
    const publicConfig = await (webServiceProvider.getWebOcConfiguration())
    if (publicConfig.general?.title) {
       this.title = publicConfig.general.title
    }
    // var currentBackgroundImage = document.getElementById('web-oc-login-container-id')
    // currentBackgroundImage?.style.setProperty("background-image","url('https://upload.wikimedia.org/wikipedia/commons/b/ba/Delta_2020-10-06_1330Z.png')")
    // console.log(currentBackgroundImage?.style)
    // Todo, once background image is available from
    // if (publicConfig.general?.login?.backgroundImage) {
    //   this.backgroundImage = publicConfig.general?.login?.backgroundImage
    // }
    document.title = this.title
  }
}

</script>

<style scoped>
.login-container {
  background-image: url("../assets/images/login_background_image.jpg");
  background-position-x: center;
  background-size: cover;
  text-align: center;
  height: 100%;
  overflow-y: auto;
}
.login-providers {
  margin: 50px;
}
</style>
