<template>
  <v-app>
    <v-main class="weboc-login__main">
      <div class="weboc-login__container">
        <h1 class="weboc-login__title">
          {{ appName }}
        </h1>
        <v-text-field
          bg-color="white"
          v-model="username"
          label="Username"
          class="weboc-login__input weboc-login__input--white-bg"
          autocomplete="username"
        />
        <v-text-field
          bg-color="white"
          v-model="password"
          label="Password"
          type="password"
          class="weboc-login__input weboc-login__input--white-bg"
          autocomplete="current-password"
        />
        <v-btn @click="login" v-bind="buttonProps" class="weboc-login__button">
        </v-btn>
        <div v-if="error" class="weboc-login__error">{{ error }}</div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { configManager } from '@/services/application-config'
import { useRoute, useRouter } from 'vue-router'
import { VBtn, VTextField } from 'vuetify/components'

const route = useRoute()
const router = useRouter()

const buttonProps = ref<VBtn['$props']>({
  prependIcon: 'mdi-login',
  text: 'Login',
  color: 'primary',
  variant: 'elevated',
})

const appName = ref('Delft-FEWS Web OC')
const username = ref('')
const password = ref('')
const error = ref('')

onMounted(() => {
  const name = configManager.getWithDefault(
    'VITE_APP_NAME',
    'Delft-FEWS Web OC',
  )
  document.title = name
  appName.value = name

  const buttonPropsSetting = configManager.getWithDefault(
    'VITE_LOGIN_BUTTON_PROPS',
    {},
  )
  if (typeof buttonPropsSetting === 'string') {
    try {
      Object.assign(buttonProps.value, JSON.parse(buttonPropsSetting))
    } catch (e) {
      console.error('Failed to parse VITE_LOGIN_BUTTON_PROPS', e)
    }
  } else if (buttonPropsSetting !== null && buttonPropsSetting !== undefined) {
    Object.assign(buttonProps.value, buttonPropsSetting)
  }
})

async function login(): Promise<void> {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password.'
    return
  }
  const credentials = btoa(`${username.value}:${password.value}`)
  try {
    const response = await fetch('https://delft-fews-weboc-test-basic-auth.k8s-preprod.directory.intra/FewsWebServices/rest/fewspiservice/v1/version', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    })
    if (response.ok) {
      console.log('Successfully logged in')
      // Redirect or reload on success
      const redirect = route.query.redirect ?? '/'
      router.push(typeof redirect === 'string' ? redirect : '/')
    } else {
      error.value = 'Login failed. Please check your credentials.'
    }
  } catch (e) {
    error.value = 'Login request failed.'
  }
}
</script>

