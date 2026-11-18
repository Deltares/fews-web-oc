import { WhatIfTemplate } from '@deltares/fews-pi-requests'
import { JsonSchema7, UISchemaElement } from '@jsonforms/core'
import { computedAsync } from '@vueuse/core'
import { MaybeRefOrGetter, toValue } from 'vue'

import { getResourcesStaticUrl } from '@/lib/fews-config'
import { generateJsonSchema } from '@/lib/whatif'

async function getFile(
  file: string,
  allowNotFound = false,
): Promise<Response | undefined> {
  const url = getResourcesStaticUrl(file)
  const response = await fetch(url)
  if (allowNotFound && response.status === 404) return undefined
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response
}

export function useWhatIfTemplateSchemas(
  whatIfTemplate: MaybeRefOrGetter<WhatIfTemplate | undefined>,
) {
  const jsonSchema = computedAsync<JsonSchema7 | undefined>(async () => {
    const _whatIfTemplate = toValue(whatIfTemplate)
    if (!_whatIfTemplate) return undefined
    return getJsonSchema(`${_whatIfTemplate.id}.schema.json`)
  })

  const uiSchema = computedAsync<UISchemaElement | undefined>(async () => {
    const _whatIfTemplate = toValue(whatIfTemplate)
    if (!_whatIfTemplate) return undefined
    return getUISchema(`${_whatIfTemplate.id}.ui-schema.json`)
  })

  async function getJsonSchema(file: string): Promise<JsonSchema7 | undefined> {
    const schema = await getFile(file, true)
    if (!schema) {
      const properties = toValue(whatIfTemplate)?.properties
      return properties ? generateJsonSchema(properties) : undefined
    }
    return schema.json()
  }

  async function getUISchema(
    file: string,
  ): Promise<UISchemaElement | undefined> {
    const schema = await getFile(file, true)
    return schema?.json()
  }

  return { jsonSchema, uiSchema }
}
