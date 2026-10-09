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

    <v-container v-if="canExcludePermissions" fluid class="pt-0 pb-3 pl-12">
      <v-row dense>
        <v-col
          v-for="permissionId in permissionsStore.assignedPermissionIds"
          :key="permissionId"
          cols="12"
          md="4"
          sm="4"
        >
          <v-checkbox-btn
            v-model="isActive[permissionId]"
            density="compact"
            class="permission-checkbox"
            :label="permissionsStore.getPermissionName(permissionId)"
          />
        </v-col>
      </v-row>

      <v-row dense justify="end">
        <v-col cols="auto" class="d-flex ga-2">
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
        </v-col>
      </v-row>
    </v-container>

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

<style scoped>
.permission-checkbox :deep(.v-label) {
  font-size: 0.85rem;
  opacity: 1;
}
</style>
