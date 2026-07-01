import { getResourcesStaticUrl } from '@/lib/fews-config'
import Ajv from 'ajv'
import {
  filterValidOverrides,
  type UserSettingsOverride,
} from '@/lib/user-settings/deserializeUserSettings'

const WEBRESOURCES_FILE = 'default-user-settings.json'
const SCHEMA_FILE = 'default-user-settings.schema.json'

function normalizeOverrideShape(input: unknown): unknown {
  return input
}

function extractOverridesFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeOverrideShape)
  }
  if (
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as { settings?: unknown[] }).settings)
  ) {
    return (payload as { settings: unknown[] }).settings.map(
      normalizeOverrideShape,
    )
  }
  return []
}

async function fetchSchema(): Promise<Record<string, unknown> | undefined> {
  const schemaUrl = getResourcesStaticUrl(SCHEMA_FILE)
  const response = await fetch(schemaUrl)
  if (!response.ok) return undefined
  return response.json() as Promise<Record<string, unknown>>
}

function validatePayloadWithSchema(
  payload: unknown,
  schema: Record<string, unknown>,
): boolean {
  const ajv = new Ajv({ allErrors: true, strict: false })
  const validate = ajv.compile(schema as never)
  const isValid = validate(payload)
  if (!isValid) {
    console.warn(
      '[useDefaultUserSettings] schema validation failed:',
      validate.errors,
    )
  }
  return isValid
}

export async function fetchWebResourcesDefaultUserSettings(): Promise<
  UserSettingsOverride[]
> {
  try {
    const url = getResourcesStaticUrl(WEBRESOURCES_FILE)
    const response = await fetch(url)
    if (!response.ok) return []

    const json: unknown = await response.json()

    try {
      const schema = await fetchSchema()
      if (schema !== undefined) {
        const schemaPayload = Array.isArray(json) ? { settings: json } : json
        if (!validatePayloadWithSchema(schemaPayload, schema)) {
          return []
        }
      }
    } catch {}

    const overrides = extractOverridesFromPayload(json)
    if (overrides.length === 0) {
      console.warn(
        '[useDefaultUserSettings] expected an array or object.settings array, got:',
        typeof json,
      )
      return []
    }

    const valid = filterValidOverrides(overrides)
    const invalidCount = overrides.length - valid.length
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
