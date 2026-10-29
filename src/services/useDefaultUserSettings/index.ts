import { getResourcesStaticUrl } from '@/lib/fews-config'
import { isValidTimeZone } from '@/lib/date/timeZone'
import type { UserSettingsOverride } from '@/lib/user-settings/deserializeUserSettings'
import { DefaultUserSettingSchemas } from '@/schemas/default-user-settings.typebox'
import { Value } from 'typebox/value'
import type { TSchema } from 'typebox'

const WEBRESOURCES_FILE = 'default-user-settings.json'
const TIME_ZONE_SETTING_ID = 'ui.timeZone'

export interface DefaultUserSettingsValidation {
  overrides: UserSettingsOverride[]
  errors: string[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

interface PropertySchema {
  type?: string
  anyOf?: { const?: unknown }[]
}

function expectedValue(schema: PropertySchema | undefined): string | undefined {
  if (schema?.anyOf?.every((option) => 'const' in option)) {
    const values = schema.anyOf.map((option) => JSON.stringify(option.const))
    return `one of ${values.join(', ')}`
  }
  if (schema?.type === 'boolean') return 'true or false'
  if (schema?.type === 'string') return 'a string'
}

/** One readable message per invalid property of an override entry. */
function describeErrors(
  schema: TSchema,
  entry: Record<string, unknown>,
): string[] {
  const properties = (schema as { properties?: Record<string, PropertySchema> })
    .properties
  const messages = new Map<string, string>()
  for (const error of Value.Errors(schema, entry)) {
    if (error.keyword === 'additionalProperties') {
      const unknown = (error.params as { additionalProperties?: string[] })
        .additionalProperties
      for (const property of unknown ?? []) {
        messages.set(property, `unknown property "${property}"`)
      }
      continue
    }
    const property = error.instancePath.replace(/^\//, '')
    if (!property || messages.has(property)) continue
    const expected = expectedValue(properties?.[property])
    messages.set(
      property,
      expected
        ? `"${property}" must be ${expected}, got ${JSON.stringify(entry[property])}`
        : `"${property}" ${error.message}`,
    )
  }
  return [...messages.values()]
}

/**
 * The schema allows any string as time zone, so leave out the options and the
 * default value that the browser does not know as time zone.
 */
function removeInvalidTimeZones(override: UserSettingsOverride): string[] {
  const errors: string[] = []
  if (override.items !== undefined) {
    const items = override.items.filter((item) => {
      const valid = isValidTimeZone(item.value)
      if (!valid) errors.push(`unknown time zone "${item.value}" ignored`)
      return valid
    })
    if (items.length > 0) {
      override.items = items
    } else {
      delete override.items
    }
  }
  if (typeof override.value === 'string' && !isValidTimeZone(override.value)) {
    errors.push(`unknown time zone "${override.value}" ignored`)
    delete override.value
  }
  return errors
}

/**
 * Validates the contents of `default-user-settings.json`: an array of
 * overrides, or an object with a `settings` array. Invalid entries are left
 * out and described in `errors`.
 */
export function validateDefaultUserSettings(
  json: unknown,
): DefaultUserSettingsValidation {
  const errors: string[] = []
  let entries: unknown[]
  if (Array.isArray(json)) {
    entries = json
  } else if (isObject(json) && Array.isArray(json.settings)) {
    entries = json.settings
    for (const key of Object.keys(json)) {
      if (key !== '$schema' && key !== 'settings') {
        errors.push(`unknown property "${key}" ignored`)
      }
    }
  } else {
    return {
      overrides: [],
      errors: ['expected an array or an object with a "settings" array'],
    }
  }

  const overrides: UserSettingsOverride[] = []
  entries.forEach((entry, index) => {
    const id = isObject(entry) ? entry.id : undefined
    if (typeof id !== 'string') {
      errors.push(`settings[${index}]: "id" is missing`)
      return
    }
    const schema = DefaultUserSettingSchemas[id]
    if (schema === undefined) {
      errors.push(`settings[${index}]: unknown setting id "${id}"`)
      return
    }
    const entryErrors = describeErrors(schema, entry as Record<string, unknown>)
    if (entryErrors.length > 0) {
      errors.push(`settings[${index}] (${id}): ${entryErrors.join('; ')}`)
      return
    }
    const override = entry as UserSettingsOverride
    if (id === TIME_ZONE_SETTING_ID) {
      const timeZoneErrors = removeInvalidTimeZones(override)
      for (const error of timeZoneErrors) {
        errors.push(`settings[${index}] (${id}): ${error}`)
      }
    }
    overrides.push(override)
  })

  return { overrides, errors }
}

export async function fetchWebResourcesDefaultUserSettings(): Promise<
  UserSettingsOverride[]
> {
  try {
    const url = getResourcesStaticUrl(WEBRESOURCES_FILE)
    // FEWS sends no Cache-Control header; revalidate so config edits apply.
    const response = await fetch(url, { cache: 'no-cache' })
    if (!response.ok) return []

    const { overrides, errors } = validateDefaultUserSettings(
      await response.json(),
    )
    if (errors.length > 0) {
      console.warn(
        `[useDefaultUserSettings] ${WEBRESOURCES_FILE}: invalid entries were ignored:\n- ${errors.join('\n- ')}`,
      )
    }
    return overrides
  } catch (error) {
    console.warn('[useDefaultUserSettings] could not load overrides:', error)
    return []
  }
}
