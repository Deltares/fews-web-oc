<template>
  <div>
    <div class="d-flex align-center px-4 py-3">
      <v-icon icon="mdi-shield-off-outline" class="mr-3" />

      <div>
        <div class="text-body-1">
          {{ t('userSettings.permissions') }}
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ subtitle }}
        </div>
      </div>
    </div>

    <v-list density="compact" class="py-0">
      <v-list-item
        v-for="permissionId in permissionsStore.assignedPermissionIds"
        :key="permissionId"
        :title="permissionsStore.getPermissionName(permissionId)"
        class="pl-12"
      >
        <template v-if="canExcludePermissions" #append>
          <v-checkbox-btn v-model="isActive[permissionId]" />
        </template>
      </v-list-item>

      <v-list-item v-if="canExcludePermissions" class="pl-12">
        <div class="d-flex justify-end ga-2">
          <v-btn
            color="primary"
            size="small"
            variant="text"
            :text="t('common.reset')"
            :disabled="!hasExcludedPermissions"
            @click="resetPermissions()"
          />

          <v-btn
            color="primary"
            size="small"
            variant="flat"
            :text="t('common.apply')"
            :disabled="!hasPendingChanges"
            @click="applyPendingChanges()"
          />
        </div>
      </v-list-item>
    </v-list>

    <v-divider />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePermissionsStore } from '@/stores/permissions'

const { t } = useI18n()

const permissionsStore = usePermissionsStore()

const canExcludePermissions = computed<boolean>(
  () => permissionsStore.excludingPermissionsIsAllowed,
)
const hasExcludedPermissions = computed<boolean>(
  () => permissionsStore.excludedPermissionIds.length > 0,
)

const subtitle = computed<string | undefined>(() =>
  !canExcludePermissions.value
    ? t('userSettings.excluding-permissions-disallowed')
    : undefined,
)

const isActive = ref<Record<string, boolean>>({})
watch(
  () => permissionsStore.assignedPermissionIds,
  () => initialiseCheckboxes(),
  { immediate: true },
)

const hasPendingChanges = computed<boolean>(() =>
  Object.entries(isActive.value).some(([permissionId, isPermissionActive]) => {
    const isActiveInStore =
      !permissionsStore.excludedPermissionIds.includes(permissionId)
    return isPermissionActive !== isActiveInStore
  }),
)

function resetPermissions(): void {
  permissionsStore.resetPermissions()
  initialiseCheckboxes()
}

function applyPendingChanges(): void {
  permissionsStore.setPermissions(isActive.value)
}

function initialiseCheckboxes(): void {
  const newIsActive: Record<string, boolean> = {}
  permissionsStore.assignedPermissionIds.forEach((permissionId) => {
    newIsActive[permissionId] =
      permissionsStore.isActivePermission(permissionId)
  })
  isActive.value = newIsActive
}
</script>
