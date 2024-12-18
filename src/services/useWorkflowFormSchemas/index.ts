import { SecondaryWorkflowGroupItem } from '@deltares/fews-pi-requests'
import { asyncComputed, MaybeRefOrGetter } from '@vueuse/core'
import { toValue } from 'vue'

import { getResourcesStaticUrl } from '@/lib/fews-config'
import { generateDefaultUISchema, generateJsonSchema } from '@/lib/workflows'

export function useWorkflowFormSchemas(
  workflow: MaybeRefOrGetter<SecondaryWorkflowGroupItem | null>,
) {
  const formSchema = asyncComputed(async () => {
    const _workflow = toValue(workflow)
    if (_workflow === null) return undefined
    return getSchema(`${_workflow.secondaryWorkflowId}.schema.json`)
  })

  const formUISchema = asyncComputed(async () => {
    const _workflow = toValue(workflow)
    if (_workflow === null) return undefined
    return getUISchema(`${_workflow.secondaryWorkflowId}.ui-schema.json`)
    // temp.elements = [...temp.elements, ...temp.elements, ...temp.elements]
    // return temp
  })

  async function getUISchema(file: string) {
    try {
      const schema = await getFile(file)
      return schema.json()
    } catch (error) {
      const workflowProperties = toValue(workflow)?.properties
      if (workflowProperties) return generateDefaultUISchema(workflowProperties)
    }
  }

  async function getSchema(file: string) {
    try {
      const schema = await getFile(file)
      return schema.json()
    } catch (error) {
      const workflowProperties = toValue(workflow)?.properties
      if (workflowProperties !== undefined)
        return generateJsonSchema(workflowProperties)
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

  return { formSchema, formUISchema }
}
