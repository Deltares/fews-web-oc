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

  return { templates, selectedTemplate, formSchemas }
}
