<template>
  <v-app>
    <v-main class="weboc-login__main">
      <div class="weboc-login__container">
        <h1 class="weboc-login__title">
          {{ appName }}
        </h1>
        <v-btn @click="login" v-bind="buttonProps" class="weboc-login__button">
        </v-btn>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { configManager } from '@/services/application-config'
import { useRoute } from 'vue-router'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.js'
import { VBtn } from 'vuetify/components'

const route = useRoute()

const buttonProps = ref<VBtn['$props']>({
  prependIcon: 'mdi-login',
  text: 'Login',
  color: 'primary',
  variant: 'elevated',
})

const appName = ref('Delft-FEWS Web OC')

onMounted(() => {
  const name = configManager.getWithDefault(
    'VITE_APP_NAME',
    'Delft-FEWS Web OC',
  )
  document.title = name
  appName.value = name

  const buttonPropsSetting = configManager.get('VITE_LOGIN_BUTTON_PROPS')
  if (typeof buttonPropsSetting === 'string') {
    try {
      Object.assign(buttonProps.value, JSON.parse(buttonPropsSetting))
    } catch (e) {
      console.error('Failed to parse VITE_LOGIN_BUTTON_PROPS', e)
    }
  } else {
    Object.assign(buttonProps.value, buttonPropsSetting)
  }
})

function login(): void {
  const redirect = route.query.redirect ?? '/'
  authenticationManager.userManager.signinRedirect({ state: redirect })
}
</script>
