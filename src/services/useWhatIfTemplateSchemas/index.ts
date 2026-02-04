import { WhatIfTemplate } from '@deltares/fews-pi-requests'
import { JsonSchema7, UISchemaElement } from '@jsonforms/core'
import { computedAsync } from '@vueuse/core'
import { MaybeRefOrGetter, toValue } from 'vue'

import { getResourcesStaticUrl } from '@/lib/fews-config'
import { generateJsonSchema } from '@/lib/whatif'

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
    try {
      const schema = await getFile(file)
      return schema.json()
    } catch (error) {
      const properties = toValue(whatIfTemplate)?.properties
      return properties ? generateJsonSchema(properties) : undefined
    }
  }

  async function getUISchema(
    file: string,
  ): Promise<UISchemaElement | undefined> {
    try {
      const schema = await getFile(file)
      return schema.json()
    } catch (error) {
      return undefined
    }
  }

  async function getFile(file: string) {
    const url = getResourcesStaticUrl(file)
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`)
      }
      return response
    } catch (error) {
      throw new Error(`Failed to fetch ${url}`)
    }
  }

  return { jsonSchema, uiSchema }
}
