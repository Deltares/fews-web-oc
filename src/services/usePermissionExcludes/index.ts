import { ref } from 'vue'
import { Permission, PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { configManager } from '../application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

const permissions = ref<Permission[]>([])
const excludedPermissions = ref<string[]>([])

export default function usePermissionExcludes() {
  function togglePermission(permissionId: string, included: boolean) {
    if (included) {
      excludedPermissions.value = excludedPermissions.value.filter(
        (perm) => perm !== permissionId,
      )
    } else {
      excludedPermissions.value.push(permissionId)
    }
  }

  function isEnabled(permissionId: string): boolean {
    return !excludedPermissions.value.includes(permissionId)
  }

  async function loadPermissions() {
    if (permissions.value.length === 0) {
      const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
      const piProvider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      // note: piProvider getPermissions should be called without excluded
      // permissions. Since this code only runs when this composable is first
      // called, we assume that excludedPermissions is empty.
      const result = await piProvider.getPermissions()
      permissions.value = result.permissions ?? []
    }
  }

  loadPermissions()
  return {
    permissions,
    togglePermission,
    isEnabled,
  }
}

export function getPermissionExcludesHeader(): Headers {
  const headerValue = excludedPermissions.value.join(',')
  if (headerValue.length == 0) {
    return new Headers({})
  }
  return new Headers({ 'fews-ws-permissions-excludes': headerValue })
}
