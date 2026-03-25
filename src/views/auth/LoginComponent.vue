<template>
  <div>
    <v-btn v-if="requiresLogin" @click="login" variant="text"> Sign in</v-btn>
    <div v-else>
      <v-menu location="bottom" width="200">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" icon>
            {{ initials }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item>{{ name }}</v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>{{ t('auth.signOut') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { authenticationManager, type AuthUser } from '@/services/authentication'
import { useRoute } from 'vue-router'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

function initialsFromName(givenName: string): string {
  let initialsString = ''
  for (const character of givenName) {
    if (character !== character.toLowerCase()) {
      initialsString = initialsString + character
    }
    if (initialsString.length === 2) return initialsString
  }
  return initialsString
}

const route = useRoute()
const initials = ref('')
const roles = ref<string[]>([])
const name = ref('')
const user = ref<AuthUser | null>(null)
const requiresLogin = ref(true)

async function setUser() {
  const authUser = await authenticationManager.getUser()
  user.value = authUser
  if (authUser) {
    requiresLogin.value = false
    name.value = authUser.name
    initials.value =
      initialsFromName(authUser.name) || authUser.name.slice(0, 2).toUpperCase()
    roles.value = authUser.roles ?? []
  } else {
    requiresLogin.value = true
  }
}

authenticationManager.onUserLoaded(() => {
  requiresLogin.value = false
  setUser()
})

onMounted((): void => {
  setUser()
})

watch(user, () => {
  if (user.value !== null) {
    requiresLogin.value = false
  } else {
    requiresLogin.value = true
  }
})

function login(): void {
  authenticationManager.login({ redirectPath: route.path })
}

async function logout(): Promise<void> {
  requiresLogin.value = true
  await authenticationManager.logout()
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
</style>
