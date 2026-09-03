<template>
  <v-list-group v-if="hasAssignedPermissions" subgroup>
    <template #activator="{ props }">
      <v-list-item v-bind="props" :title="t('userSettings.permissions')" />
    </template>

    <v-list-item
      v-for="(permissionId, index) in permissionsStore.assignedPermissionIds"
      :key="index"
    >
      {{ permissionId }}
      <template #append>
        <v-list-item-action>
          <v-checkbox-btn v-model="isActive[permissionId]" />
        </v-list-item-action>
      </template>
    </v-list-item>

    <v-list-item>
      <div class="d-flex justify-space-between">
        <v-btn
          color="primary"
          size="small"
          variant="flat"
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
  </v-list-group>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePermissionsStore } from '@/stores/permissions'

const { t } = useI18n()

const permissionsStore = usePermissionsStore()

const hasAssignedPermissions = computed<boolean>(
  () => permissionsStore.assignedPermissionIds.length > 0,
)
const hasExcludedPermissions = computed<boolean>(
  () => permissionsStore.excludedPermissionIds.length > 0,
)

const isActive = ref<Record<string, boolean>>(initialiseCheckboxes())
const hasPendingChanges = computed<boolean>(() =>
  Object.entries(isActive.value).some(([permissionId, isPermissionActive]) => {
    const isActiveInStore =
      !permissionsStore.excludedPermissionIds.includes(permissionId)
    return isPermissionActive !== isActiveInStore
  }),
)

function resetPermissions(): void {
  permissionsStore.resetPermissions()
  isActive.value = initialiseCheckboxes()
}

function applyPendingChanges(): void {
  permissionsStore.setPermissions(isActive.value)
}

function initialiseCheckboxes(): Record<string, boolean> {
  const isActive: Record<string, boolean> = {}
  permissionsStore.assignedPermissionIds.forEach((permissionId) => {
    isActive[permissionId] = permissionsStore.isActivePermission(permissionId)
  })
  return isActive
}
</script>
