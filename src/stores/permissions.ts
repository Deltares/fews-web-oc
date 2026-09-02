import {
  PiWebserviceProvider,
  type Permission,
} from '@deltares/fews-pi-requests'
import { until } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { createTransformRequestFn } from '@/lib/requests/transformRequest'

import { configManager } from '@/services/application-config'

export const usePermissionsStore = defineStore(
  'permissions',
  () => {
    const hasLoaded = ref<boolean>(false)

    const permissions = ref<Permission[]>([])

    const assignedPermissionIds = computed<string[]>(() =>
      permissions.value
        .filter((permission) => permission.assigned)
        .map((permission) => permission.id),
    )
    const excludedPermissionIds = ref<string[]>([])

    const excludedPermissionsKey = computed<string>(() => {
      if (excludedPermissionIds.value.length === 0) return 'none-excluded'
      return excludedPermissionIds.value.toSorted().join(',')
    })

    function isActivePermission(permissionId: string): boolean {
      const hasPermission = assignedPermissionIds.value.includes(permissionId)
      if (!hasPermission) return false
      // If we have the permission, check whether it was excluded.
      return !excludedPermissionIds.value.includes(permissionId)
    }

    async function getPermissionsExcludesHeader(): Promise<Headers> {
      await waitUntilPermissionsLoaded()
      return excludedPermissionIds.value.length === 0
        ? new Headers()
        : new Headers({
            'fews-ws-permissions-excludes':
              excludedPermissionIds.value.join(','),
          })
    }

    function setPermissions(updatedPermissions: Record<string, boolean>): void {
      let newExcludedPermissionIds = excludedPermissionIds.value
      Object.entries(updatedPermissions).forEach(
        ([currentPermissionId, isCurrentActive]) => {
          if (isCurrentActive) {
            // Remove active permissions from the list of excluded IDs if they
            // are in it.
            newExcludedPermissionIds = newExcludedPermissionIds.filter(
              (permissionId) => permissionId !== currentPermissionId,
            )
          } else {
            // If the permission to be disabled is already excluded, do nothing.
            if (newExcludedPermissionIds.includes(currentPermissionId)) return
            // Otherwise, add it to the list of excluded permissions.
            newExcludedPermissionIds.push(currentPermissionId)
          }
        },
      )
      // Update the entire array of excluded permissions at once; this will
      // result in a different permissions key which can be used to trigger a
      // reload of (parts of) the application.
      excludedPermissionIds.value = newExcludedPermissionIds
    }

    function resetPermissions(): void {
      excludedPermissionIds.value = []
    }

    async function waitUntilPermissionsLoaded(): Promise<void> {
      await until(hasLoaded).toBeTruthy()
    }

    async function loadPermissions(): Promise<void> {
      const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
      // Disable permission excludes in the transform request function while
      // initialising this store.
      const disablePermissionExcludes = true
      const piProvider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(
          undefined,
          disablePermissionExcludes,
        ),
      })
      const response = await piProvider.getPermissions()
      permissions.value = response.permissions ?? []

      hasLoaded.value = true
    }

    // Load permissions upon store initialisation.
    loadPermissions().catch((error) =>
      console.error(`Failed to load permissions: ${error}`),
    )

    return {
      permissions,
      assignedPermissionIds,
      excludedPermissionIds,
      excludedPermissionsKey,
      isActivePermission,
      getPermissionsExcludesHeader,
      setPermissions,
      resetPermissions,
    }
  },
  { persist: { storage: globalThis.sessionStorage } },
)
