<template>
  <div>
    <v-btn v-if="requiresLogin" @click="login" variant="text"> Sign in</v-btn>
    <div v-else>
      <v-menu
        location="bottom"
        width="260"
        :close-on-content-click="false"
        v-model="menuOpen"
      >
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" icon>
            {{ initials }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item>
            <div class="d-flex align-center">
              <span class="user-avatar mr-2">{{ initials }}</span>
              <span class="user-name">{{ name }}</span>
            </div>
          </v-list-item>
          <template v-if="disableablePermissions.length > 0">
            <v-list-item>
              <v-list-item-title class="mb-1">{{
                t('userSettings.permissions')
              }}</v-list-item-title>
              <template v-slot:append>
                <v-btn
                  v-if="permissionsChanged"
                  color="primary"
                  @click="applyPermissionsAndClose"
                  size="small"
                  variant="flat"
                >
                  {{ t('common.apply') }}
                </v-btn>
              </template>
            </v-list-item>
            <v-list-item>
              <v-list density="compact" class="pa-0">
                <v-list-item
                  v-for="perm in disableablePermissions"
                  :key="perm.id"
                  class="pa-0"
                >
                  <v-checkbox
                    density="compact"
                    color="primary"
                    :model-value="isPendingEnabled(perm.id)"
                    @update:model-value="
                      (val) => onPermissionChange(perm.id, val ?? true)
                    "
                    hide-details
                    class="ml-3"
                    :label="perm.id"
                  >
                    <template #label>
                      <v-label class="text-subtitle-2 text-medium-emphasis">{{
                        perm.id
                      }}</v-label>
                    </template>
                  </v-checkbox>
                </v-list-item>
              </v-list>
            </v-list-item>
          </template>
          <v-list-item @click="logout" v-if="hasUserManager">
            <v-list-item-title>{{ t('auth.signOut') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.js'
import { useRoute } from 'vue-router'
import type { User } from 'oidc-client-ts'
import {
  initialsFromUpperCaseName,
  initialsFromPreferredUserName,
} from '@/lib/auth/initials.ts'

import { useI18n } from 'vue-i18n'
import usePermissionExcludes from '@/services/usePermissionExcludes'

const { t } = useI18n()
const route = useRoute()

const PLACEHOLDER_NAME = 'User'
const hasUserManager = !!authenticationManager?.userManager

const initials = ref('U')
const roles = ref([''])
const name = ref(PLACEHOLDER_NAME)
const user = ref<User | null>(null)
const requiresLogin = ref(hasUserManager)

const { permissions, isEnabled, togglePermission } = usePermissionExcludes()
const permissionsChanged = ref(false)
const pendingEnabled = ref<Record<string, boolean>>({})
const menuOpen = ref(false)

const disableablePermissions = computed(() =>
  permissions.value.filter((p) => p.assigned && isEnabled(p.id)),
)

watch(
  permissions,
  (perms) => {
    perms.forEach((p) => {
      if (!(p.id in pendingEnabled.value)) {
        pendingEnabled.value[p.id] = isEnabled(p.id)
      }
    })
  },
  { immediate: true },
)

function isPendingEnabled(permId: string): boolean {
  return pendingEnabled.value[permId] ?? isEnabled(permId)
}

function onPermissionChange(permissionId: string, included: boolean) {
  pendingEnabled.value[permissionId] = included
  permissionsChanged.value = permissions.value.some(
    (p) => isPendingEnabled(p.id) !== isEnabled(p.id),
  )
}

function applyPermissionsAndClose() {
  permissions.value.forEach((p) => {
    if (isPendingEnabled(p.id) !== isEnabled(p.id)) {
      togglePermission(p.id, isPendingEnabled(p.id))
    }
  })
  menuOpen.value = false
  window.location.reload()
}

function setUser() {
  if (!hasUserManager) return
  authenticationManager.userManager
    .getUser()
    .then((response) => {
      user.value = response
    })
    .catch((err) => {
      console.error({ err })
    })
}

if (hasUserManager) {
  authenticationManager.userManager.events.addUserLoaded(() => {
    requiresLogin.value = false
    setUser()
  })
}

onMounted(() => {
  if (hasUserManager) {
    setUser()
  } else {
    requiresLogin.value = false
  }
})

watch(user, () => {
  console.log({ user: user.value })
  if (user.value !== null) {
    requiresLogin.value = false
    if (user.value.profile?.name !== undefined) {
      name.value = user.value.profile.name
      initials.value = initialsFromUpperCaseName(user.value.profile.name)
      roles.value = user.value.profile.roles
        ? (user.value.profile.roles as string[])
        : []
    } else if (user.value.profile?.preferred_username !== undefined) {
      name.value = user.value.profile.preferred_username
      initials.value = initialsFromPreferredUserName(
        user.value.profile.preferred_username,
      )
      roles.value = user.value.profile.roles
        ? (user.value.profile.roles as string[])
        : []
    }
  } else {
    initials.value = 'U'
    name.value = PLACEHOLDER_NAME
    requiresLogin.value = hasUserManager
  }
})

function login(): void {
  if (!hasUserManager) return
  authenticationManager.userManager.signinRedirect({ state: route.path })
}

function logout(): void {
  if (!hasUserManager) return
  requiresLogin.value = true
  authenticationManager.userManager.signoutRedirect({ state: '/login' })
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--weboc-app-bar-bg-color);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.user-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--contrast-color, #222);
}
</style>
