import { WhatIfTemplate } from '@deltares/fews-pi-requests'
import { JsonSchema, UISchemaElement } from '@jsonforms/core'
import { asyncComputed, MaybeRefOrGetter } from '@vueuse/core'
import { toValue } from 'vue'

import { getResourcesStaticUrl } from '@/lib/fews-config'
import { generateJsonSchema } from '@/lib/whatif'

export function useWorkflowFormSchemas(
  workflow: MaybeRefOrGetter<WhatIfTemplate | undefined>,
) {
  const jsonSchema = asyncComputed<JsonSchema | undefined>(async () => {
    const _workflow = toValue(workflow)
    if (!_workflow) return undefined
    return getJsonSchema(`${_workflow.id}.schema.json`)
  })

  const uiSchema = asyncComputed<UISchemaElement | undefined>(async () => {
    const _workflow = toValue(workflow)
    if (!_workflow) return undefined
    return getUISchema(`${_workflow.id}.ui-schema.json`)
  })

  async function getJsonSchema(file: string): Promise<JsonSchema | undefined> {
    try {
      const schema = await getFile(file)
      return schema.json()
    } catch (error) {
      const workflowProperties = toValue(workflow)?.properties
      return workflowProperties
        ? generateJsonSchema(workflowProperties)
        : undefined
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
