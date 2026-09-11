import {
  PiWebserviceProvider,
  type Permission,
} from '@deltares/fews-pi-requests'
import { until } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  createTransformRequestFn,
  getRequestHeaders,
} from '@/lib/requests/transformRequest'

import { configManager } from '@/services/application-config'

const FEWS_PERMISSION_EXCLUDES_HEADER = 'fews-ws-permissions-excludes'

export const usePermissionsStore = defineStore(
  'permissions',
  () => {
    const hasLoaded = ref<boolean>(false)
    const excludingPermissionsIsAllowed = ref<boolean>(false)

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

    function getPermissionName(permissionId: string): string {
      const permission = permissions.value.find(
        (permission) => permission.id === permissionId,
      )
      if (permission === undefined) {
        throw new Error(
          `Could not get name for non-existent permission with ID "${permissionId}".`,
        )
      }
      return permission.name ?? permission.id
    }

    async function getPermissionsExcludesHeader(): Promise<Headers> {
      await waitUntilPermissionsLoaded()
      return excludedPermissionIds.value.length === 0
        ? new Headers()
        : new Headers({
            [FEWS_PERMISSION_EXCLUDES_HEADER]:
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
      try {
        const response = await piProvider.getPermissions()
        permissions.value = response.permissions ?? []
      } finally {
        hasLoaded.value = true
      }
    }

    async function checkExcludedPermissionsHeaderAllowed(): Promise<void> {
      const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
      const headers = await getRequestHeaders(true)
      headers.set(FEWS_PERMISSION_EXCLUDES_HEADER, 'dummy')

      // Try an options request with the permission excludes header on the
      // version endpoint to see whether the server accepts the header. There
      // might be several reasons why it might not, e.g. web server
      // configuration.
      const versionUrl = `${baseUrl}/version`
      const request = new Request(versionUrl, { headers, method: 'OPTIONS' })
      try {
        const response = await fetch(request)
        excludingPermissionsIsAllowed.value = response.ok
      } catch {
        excludingPermissionsIsAllowed.value = false
      }
    }

    // Load permissions upon store initialisation.
    loadPermissions().catch((error) =>
      console.error(`Failed to load permissions: ${error}`),
    )
    checkExcludedPermissionsHeaderAllowed().catch((error) =>
      console.error(
        `Failed to check whether excluded permissions header is allowed: ${error}`,
      ),
    )

    return {
      permissions,
      excludingPermissionsIsAllowed,
      assignedPermissionIds,
      excludedPermissionIds,
      excludedPermissionsKey,
      isActivePermission,
      getPermissionName,
      getPermissionsExcludesHeader,
      setPermissions,
      resetPermissions,
    }
  },
  {
    persist: {
      storage: globalThis.sessionStorage,
      pick: ['excludedPermissionIds'],
    },
  },
)
