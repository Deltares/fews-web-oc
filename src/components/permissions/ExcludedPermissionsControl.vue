<template>
  <v-list>
    <v-list-group>
      <template #activator="{ props }">
        <v-list-item
          v-bind="props"
          :title="t('userSettings.permissions')"
          :subtitle="subtitle"
        />
      </template>

      <v-list-item
        v-for="(permissionId, index) in permissionsStore.assignedPermissionIds"
        :key="index"
      >
        {{ permissionId }}
        <template #append>
          <v-list-item-action>
            <v-checkbox-btn
              v-model="isActive[permissionId]"
              :disabled="disableExcludePermissions"
            />
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
            :disabled="disableExcludePermissions || !hasExcludedPermissions"
            @click="resetPermissions()"
          />
          <v-btn
            color="primary"
            size="small"
            variant="flat"
            :text="t('common.apply')"
            :disabled="disableExcludePermissions || !hasPendingChanges"
            @click="applyPendingChanges()"
          />
        </div>
      </v-list-item>
    </v-list-group>
  </v-list>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePermissionsStore } from '@/stores/permissions'

const { t } = useI18n()

const permissionsStore = usePermissionsStore()

const disableExcludePermissions = computed<boolean>(
  () => !permissionsStore.excludingPermissionsIsAllowed,
)
const hasExcludedPermissions = computed<boolean>(
  () => permissionsStore.excludedPermissionIds.length > 0,
)

const subtitle = computed<string | undefined>(() =>
  disableExcludePermissions.value
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
