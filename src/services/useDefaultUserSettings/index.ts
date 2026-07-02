import { getResourcesStaticUrl } from '@/lib/fews-config'
import {
  filterValidOverrides,
  type UserSettingsOverride,
} from '@/lib/user-settings/deserializeUserSettings'
import {
  DefaultUserSettingSchema,
  DefaultUserSettingsSchema,
} from '@/schemas/default-user-settings.typebox'
import { Value } from '@sinclair/typebox/value'

const WEBRESOURCES_FILE = 'default-user-settings.json'

function extractOverridesFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as { settings?: unknown[] }).settings)
  ) {
    return (payload as { settings: unknown[] }).settings
  }

  return []
}

export async function fetchWebResourcesDefaultUserSettings(): Promise<
  UserSettingsOverride[]
> {
  try {
    const url = getResourcesStaticUrl(WEBRESOURCES_FILE)
    const response = await fetch(url)
    if (!response.ok) return []

    const json: unknown = await response.json()
    const normalizedPayload = Array.isArray(json) ? { settings: json } : json

    const payloadIsValid = Value.Check(
      DefaultUserSettingsSchema,
      normalizedPayload,
    )
    if (!payloadIsValid) {
      const errors = [...Value.Errors(DefaultUserSettingsSchema, normalizedPayload)].map(
        (error) => error.message,
      )
      console.warn(
        '[useDefaultUserSettings] payload does not fully match schema:',
        errors,
      )
    }

    const overrides = extractOverridesFromPayload(json)

    if (overrides.length === 0) {
      console.warn(
        '[useDefaultUserSettings] expected an array or object.settings array, got:',
        typeof json,
      )
      return []
    }

    const schemaValidOverrides = overrides.filter((override) =>
      Value.Check(DefaultUserSettingSchema, override),
    )

    const schemaInvalidCount = overrides.length - schemaValidOverrides.length
    if (schemaInvalidCount > 0) {
      const firstInvalid = overrides.find((override) =>
        !Value.Check(DefaultUserSettingSchema, override),
      )
      const firstInvalidErrors = firstInvalid
        ? [...Value.Errors(DefaultUserSettingSchema, firstInvalid)].map(
            (error) => error.message,
          )
        : []

      console.warn(
        `[useDefaultUserSettings] ${schemaInvalidCount} override(s) did not match schema and were ignored.`,
        firstInvalidErrors,
      )
    }

    const valid = filterValidOverrides(schemaValidOverrides)
    const invalidCount = schemaValidOverrides.length - valid.length
    if (invalidCount > 0) {
      console.warn(
        `[useDefaultUserSettings] ${invalidCount} invalid override(s) were ignored.`,
      )
    }

    return valid
  } catch (error) {
    console.warn('[useDefaultUserSettings] could not load overrides:', error)
    return []
  }
}
