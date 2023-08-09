<template>
  <v-app>
    <v-main class="login-container" id="web-oc-login-container-id">
      <div>
        <h1 style="color: white;">{{ title }}</h1>
        <div class="login-providers">
          <deltares-login loginButtonText="Sign in"/>
        </div>
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
    if (publicConfig.general?.icons?.favicon) {
      const faviconUrl = webServiceProvider.resourcesStaticUrl(publicConfig.general?.icons?.favicon)
      const currentFavicon = document.querySelector("link[rel='icon']")
      currentFavicon?.setAttribute('href', faviconUrl.toString())
    }
    if (publicConfig.general?.login?.backgroundImage) {
      const backgroundImage: string = webServiceProvider.resourcesStaticUrl(publicConfig.general?.login?.backgroundImage).toString()
      const currentBackgroundImage = document.getElementById('web-oc-login-container-id')
      const backGroundUrl: string = "url('" + backgroundImage + "')"
      currentBackgroundImage?.style.setProperty("background-image",backGroundUrl)
    }
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
