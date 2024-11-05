<template>
  <v-card>
    <v-card-title>Configured properties</v-card-title>
    <v-card-text>
      <v-data-table
        :items="propertiesArray"
        :headers="tableHeaders"
        items-per-page="-1"
        hide-default-footer
      />
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed } from 'vue'

import type {
  WhatIfFormSchemas,
  WhatIfProperties,
} from '@/services/useWhatIfScenarios'
import { ControlElement, Layout, UISchemaElement } from '@jsonforms/core'

interface Props {
  properties: WhatIfProperties
  formSchemas: WhatIfFormSchemas | null
}
const props = defineProps<Props>()

interface WhatIfProperty {
  id: string
  description: string
  value: number | null
}
const propertiesArray = computed<WhatIfProperty[]>(() => {
  return Object.entries(props.properties).map(([id, value]) => ({
    id,
    description: findDescription(id) ?? id,
    value: value ?? null,
  }))
})

const tableHeaders = computed(() => [
  {
    id: 'description',
    title: 'Description',
    value: 'description',
  },
  {
    id: 'value',
    title: 'Value',
    value: 'value',
  },
])

function findDescription(propertyId: string): string | null {
  if (!props.formSchemas) return propertyId

  const propertyScope = `#/properties/${propertyId}`
  const findLabelForScope = (element: UISchemaElement): string | null => {
    if (element.type === 'Control') {
      // We are a control element; return the label if we are a control for the
      // property we are searching for.
      const controlElement = element as ControlElement
      if (controlElement.scope === propertyScope) {
        return typeof controlElement.label === 'string'
          ? controlElement.label
          : null
      }
      return null
    } else {
      // We are a layout element; recursively loop over all sub-elements to find
      // a control element with the property we are searching for.
      const layoutElement = element as Layout
      for (const element of layoutElement.elements) {
        const label = findLabelForScope(element)
        if (label !== null) return label
      }
    }
    return null
  }
  return findLabelForScope(props.formSchemas.ui)
}
</script>
