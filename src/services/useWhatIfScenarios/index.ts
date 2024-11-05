import { JsonSchema, UISchemaElement } from '@jsonforms/core'

import propertiesSchema from './properties-schema.json'
import uiSchema from './ui-schema.json'
import { computed, MaybeRefOrGetter, toValue } from 'vue'
import { asyncComputed } from '@vueuse/core'

export interface WhatIfTemplate {
  id: string
  title: string
  workflowId: string
  propertiesSchemaUrl: string
  uiSchemaUrl: string
}

export interface WhatIfFormSchemas {
  properties: JsonSchema
  ui: UISchemaElement
}

export interface WhatIfProperties {
  [key: string]: number | undefined
}

export enum SubmitStatus {
  Success = 'success',
  Error = 'error',
}

export interface SubmitSuccess {
  status: SubmitStatus.Success
  taskId: string
}

export interface SubmitError {
  status: SubmitStatus.Error
  error: string
}

export type SubmitResult = SubmitSuccess | SubmitError

export function useWhatIfScenarios(
  nodeId: MaybeRefOrGetter<string>,
  selectedWhatIfTemplateId: MaybeRefOrGetter<string | null>,
) {
  const templates = asyncComputed<WhatIfTemplate[]>(
    async () => fetchWhatIfTemplates(toValue(nodeId)),
    [],
  )
  const selectedTemplate = computed<WhatIfTemplate | null>(() => {
    const template = templates.value.find(
      (template) => template.id === toValue(selectedWhatIfTemplateId),
    )
    return template ?? null
  })

  const formSchemas = asyncComputed<WhatIfFormSchemas | null>(async () => {
    if (!selectedTemplate.value) return null
    return fetchFormSchemas(selectedTemplate.value)
  }, null)

  async function fetchWhatIfTemplateIds(_nodeId: string): Promise<string[]> {
    // TODO: fetch from FEWS end point or topology?
    //       list of whatIfTemplateIds for a nodeId.
    return ['what-if-template-1', 'what-if-template-2']
  }

  async function fetchWhatIfTemplate(
    whatIfTemplateId: string,
  ): Promise<WhatIfTemplate> {
    // TODO: fetch properties of a what-if template given its ID.

    const id = whatIfTemplateId.replace('-template', '')
    const title = whatIfTemplateId.replaceAll('-', ' ')
    const workflowId = whatIfTemplateId.replace('what-if-template', 'workflow')
    const propertiesSchemaUrl = 'placeholder'
    const uiSchemaUrl = 'placeholder'
    return {
      id,
      title,
      workflowId,
      propertiesSchemaUrl,
      uiSchemaUrl,
    }
  }

  async function fetchWhatIfTemplates(
    nodeId: string,
  ): Promise<WhatIfTemplate[]> {
    const whatIfTemplateIds = await fetchWhatIfTemplateIds(nodeId)
    const whatIfTemplates = await Promise.all(
      whatIfTemplateIds.map(fetchWhatIfTemplate),
    )
    return whatIfTemplates
  }

  async function fetchFormSchemas(
    _whatIfTemplate: WhatIfTemplate,
  ): Promise<WhatIfFormSchemas> {
    // TODO: actually fetch schemas based on the provided URLs.
    return {
      properties: propertiesSchema,
      ui: uiSchema,
    }
  }

  async function submit(properties: WhatIfProperties): Promise<SubmitResult> {
    // TODO: submit workflow for what-if scenario with these properties.
    const isSuccess = properties['simulation_period_seconds'] === 5
    if (isSuccess) {
      return { status: SubmitStatus.Success, taskId: 'task-id' }
    } else {
      return { status: SubmitStatus.Error, error: 'Invalid simulation period.' }
    }
  }

  return { templates, selectedTemplate, formSchemas, submit }
}
