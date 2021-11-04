<template>
  <div>
    <v-btn @click="login" outlined block>
      Login
    </v-btn>
    <v-btn @click="logout" outlined block>
      Logout
    </v-btn>
  </div>
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
.account {
  height: 100%;
}
</style>
