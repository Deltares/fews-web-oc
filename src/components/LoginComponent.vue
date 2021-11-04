<template>
  <v-app-bar color="primary" dense app>
    <img src="@/assets/images/deltares_logo.png" contain height="100%" />
    <v-toolbar-title>Delft-fews web OC</v-toolbar-title>
    <v-spacer />
    <v-btn @click="login" text>
      Login
    </v-btn>
    <v-btn @click="logout" text>
      Logout
    </v-btn>
  </v-app-bar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import auth from '@/components/auth'

@Component
export default class LoginComponent extends Vue {
  login (): void {
    auth.signinRedirect({ state: window.location.href })
  }

  logout (): void {
    auth.signoutRedirect({ state: '/portal' })
  }
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
</style>
