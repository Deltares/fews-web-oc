<template>
  <v-app>
    <v-main class="login-container">
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

@Component({
  components: {
    DeltaresLogin
  }
})
export default class LoginView extends Vue {}
</script>

<style scoped>
.login-container {
  background-image: url("../assets/images/D111-103_getijdenland_small.jpg");
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
