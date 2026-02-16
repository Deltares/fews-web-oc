import { ref } from 'vue'
import { Permission, PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { configManager } from '../application-config'
import { authenticationManager } from '../authentication/AuthenticationManager'

// export interface Permission extends PermissionWithoutUsed {
// }

let permissions = ref(Array<Permission>())
let excludedPermissions = ref(Array<string>())

export default async function usePermissionExcludes() {
  if (permissions.value.length === 0) {
    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: (request: Request) => {
        return Promise.resolve(
          authenticationManager.transformRequestAuthNoExcludes(request),
        )
      },
    })
    piProvider.getPermissions().then((res) => {
      permissions.value = res.permissions ?? []
    })
  }

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

  return { permissions, togglePermission, isEnabled }
}

export function getPermissionExcludesHeader(): Headers {
  const headerValue = excludedPermissions.value.join(',')
  if (headerValue.length == 0) {
    return new Headers({})
  }
  return new Headers({ 'fews-ws-permissions-excludes': headerValue })
}
