<template>
  <v-app>
    <v-main class="weboc-login__main">
      <div class="weboc-login__container">
        <h1 class="weboc-login__title">
          {{ appName }}
        </h1>
        <template v-if="isBasicAuth">
          <v-form class="weboc-login__form" @submit.prevent="basicLogin">
            <v-text-field
              v-model="username"
              :label="t('auth.username')"
              variant="solo"
              density="comfortable"
              prepend-inner-icon="mdi-account"
              autocomplete="username"
              :disabled="loading"
            />
            <v-text-field
              v-model="password"
              :label="t('auth.password')"
              :type="showPassword ? 'text' : 'password'"
              variant="solo"
              density="comfortable"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              autocomplete="current-password"
              :disabled="loading"
              @click:append-inner="showPassword = !showPassword"
            />
            <v-alert
              v-if="errorMessage"
              type="error"
              density="compact"
              class="mb-4"
            >
              {{ errorMessage }}
            </v-alert>
            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              :loading="loading"
              :disabled="!username || !password"
              block
              prepend-icon="mdi-login"
            >
              {{ t('auth.signIn') }}
            </v-btn>
          </v-form>
        </template>
        <template v-else>
          <v-btn
            @click="oidcLogin"
            v-bind="buttonProps"
            class="weboc-login__button"
          >
          </v-btn>
        </template>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { configManager } from '@/services/application-config'
import { useRoute, useRouter } from 'vue-router'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.js'
import { basicAuthManager } from '@/services/authentication/BasicAuthManager'
import { VBtn } from 'vuetify/components'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const isBasicAuth = configManager.authType === 'basic'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

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

  if (!isBasicAuth) {
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
    } else if (
      buttonPropsSetting !== null &&
      buttonPropsSetting !== undefined
    ) {
      Object.assign(buttonProps.value, buttonPropsSetting)
    }
  }
})

async function basicLogin(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  basicAuthManager.login(username.value, password.value)
  try {
    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    const response = await fetch(`${baseUrl}rest/fewspiservice/v1/version`, {
      headers: {
        Authorization: basicAuthManager.getAuthorizationHeader(),
      },
    })
    if (!response.ok) {
      basicAuthManager.logout()
      errorMessage.value = t('auth.invalidCredentials')
      return
    }
  } catch {
    basicAuthManager.logout()
    errorMessage.value = t('auth.loginFailed')
    return
  } finally {
    loading.value = false
  }
  const redirect = (route.query.redirect as string) ?? '/'
  router.push(redirect)
}

function oidcLogin(): void {
  const redirect = route.query.redirect ?? '/'
  authenticationManager.userManager.signinRedirect({ state: redirect })
}
</script>
