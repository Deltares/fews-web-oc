<template>
  <v-app>
    <v-main class="weboc-login__main">
      <div class="weboc-login__container">
        <h1 class="weboc-login__title" ref="app-name">
          Delft-FEWS Web Operator Client
        </h1>
        <div class="weboc-login-provider">
          <v-btn
            @click="login"
            color="primary"
            variant="elevated"
            class="weboc-login-provider__button"
            :prepend-icon="prependIcon"
            :append-icon="appendIcon"
          >
            <span>{{ label }}</span>
          </v-btn>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'
import { configManager } from '@/services/application-config'
import { useRoute } from 'vue-router'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.js'

const route = useRoute()

const appName = useTemplateRef('app-name')

const label = configManager.getWithDefault(
  'VITE_LOGIN_PROVIDER_LABEL',
  'Sign in',
)
const appendIcon = configManager.getWithDefault(
  'VITE_LOGIN_PROVIDER_APPEND_ICON',
  '',
)
const prependIcon = configManager.getWithDefault(
  'VITE_LOGIN_PROVIDER_PREPEND_ICON',
  '',
)

onMounted(() => {
  const name = configManager.getWithDefault(
    'VITE_APP_NAME',
    'Delft-FEWS Web OC',
  )
  appName.value!.textContent = name
  document.title = name
})

function login(): void {
  const redirect = route.query.redirect ?? '/'
  authenticationManager.userManager.signinRedirect({ state: redirect })
}
</script>

