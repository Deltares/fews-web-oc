import { Reactive, reactive } from 'vue'
import {
  Permission as PermissionWithoutUsed,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import { configManager } from '../application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

export interface Permission extends PermissionWithoutUsed {
  used: boolean
}

let permissions = Array<Reactive<Permission>>()

export default function usePermissionExcludes() {
  async function getPermissions(): Promise<Reactive<Permission>[]> {
    if (permissions.length == 0) {
      const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
      const piProvider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const response = await piProvider.getPermissions()
      const permissionsWithoutUsed: PermissionWithoutUsed[] =
        response.permissions ?? []
      const permissionsWithUsed: Permission[] = []
      for (const perm of permissionsWithoutUsed) {
        permissionsWithUsed.push(reactive({ ...perm, used: true }))
      }
      permissions = permissionsWithUsed
    }
    return permissions
  }

  return { getPermissions, getPermissionExcludesHeader }
}

export function getPermissionExcludesHeader(): Headers {
  // all unused permissions sohould be included in the header
  const headerValue = permissions
    .flatMap((perm) => (!perm.used ? perm.id : []))
    .join(',')
  if (headerValue.length == 0) {
    return new Headers({})
  }
  return new Headers({ 'fews-ws-permissions-excludes': headerValue })
}
