<template>
  <v-list-item
    v-if="disableablePermissions.length > 0 || hasSessionPermissions"
  >
    <v-list-item-title class="mb-1">{{
      t('userSettings.permissions')
    }}</v-list-item-title>
    <template v-slot:append>
      <v-btn
        v-if="permissionsChanged || hasSessionPermissions"
        color="primary"
        @click="
          permissionsChanged ? applyPermissionsAndClose() : resetPermissions()
        "
        size="small"
        variant="flat"
      >
        {{ hasSessionPermissions ? t('common.reset') : t('common.apply') }}
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

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import usePermissionExcludes from '@/services/usePermissionExcludes'

interface Emits {
  closeMenu: []
}
const emit = defineEmits<Emits>()

const { t } = useI18n()

const { permissions, isEnabled, togglePermission } = usePermissionExcludes()

const permissionsChanged = ref(false)
const pendingEnabled = ref<Record<string, boolean>>({})

const disableablePermissions = computed(() =>
  permissions.value.filter((p) => p.assigned && isEnabled(p.id)),
)

const STORAGE_KEY = 'v1-weboc-permission-excludes'
const hasSessionPermissions = computed(() => {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    return stored && JSON.parse(stored).length > 0
  } catch {
    return false
  }
})

function resetPermissions() {
  window.sessionStorage.removeItem(STORAGE_KEY)
  // Reset local state
  Object.keys(pendingEnabled.value).forEach((key) => {
    pendingEnabled.value[key] = true
  })
  permissionsChanged.value = false
  window.location.reload()
}

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
  emit('closeMenu')
  window.location.reload()
}
</script>
