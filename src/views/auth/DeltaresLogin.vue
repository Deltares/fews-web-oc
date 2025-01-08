<template>
  <v-btn @click="login" color="primary" variant="elevated">
    <v-icon>{{ loginIcon }}</v-icon>{{ loginText }}
  </v-btn>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.js'

import { configManager } from '@/services/application-config';

const route = useRoute()

function login(): void {
  const redirect = route.query.redirect ?? '/'
  authenticationManager.userManager.signinRedirect({ state: redirect })
}

const loginText = configManager.get('LOGIN_TEXT') ?? "Sign in";
const loginIcon = configManager.get('LOGIN_ICON') ?? "mdi-microsoft-windows";
</script>
