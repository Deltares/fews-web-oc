<template>
  <div>
    <div class="mb-2 text-medium-emphasis">What-if scenario configuration</div>
    <DataTable :table-data="tableData" />
  </div>
</template>
<script setup lang="ts">
import {
  WhatIfScenarioDescriptor,
  WhatIfTemplate,
} from '@deltares/fews-pi-requests'
import { computed } from 'vue'

import {
  EXCLUDED_PROPERTY_IDS,
  formatWhatIfScenarioProperty,
  ScenarioProperty,
} from '@/lib/whatif'

import { useAvailableWhatIfTemplatesStore } from '@/stores/availableWhatIfTemplates'

import DataTable from '@/components/general/DataTable.vue'
import { chunk } from 'lodash-es'

const whatIfTemplatesStore = useAvailableWhatIfTemplatesStore()

interface Props {
  whatIfScenario: WhatIfScenarioDescriptor
  numColumns?: number
}
const props = withDefaults(defineProps<Props>(), { numColumns: 1 })

const whatIfTemplate = computed<WhatIfTemplate | null>(
  () =>
    whatIfTemplatesStore.byId(props.whatIfScenario.whatIfTemplateId) ?? null,
)
const visibleProperties = computed<ScenarioProperty[]>(() => {
  const properties = props.whatIfScenario.properties ?? []
  return properties.filter(
    (property) =>
      property.type !== 'triggeredProperty' &&
      !EXCLUDED_PROPERTY_IDS.includes(property.id),
  )
})

const tableData = computed(() => {
  // Group properties in rows of numColumns, then convert those to a format
  // accepted by DataTable.
  const chunkedProperties = chunk(visibleProperties.value, props.numColumns)
  const columnWidth = `${100 / props.numColumns}%`
  return chunkedProperties.map((rowProperties) => ({
    columns: rowProperties.map((property) =>
      convertPropertyToColumn(property, columnWidth),
    ),
  }))
})

function convertPropertyToColumn(
  property: ScenarioProperty,
  columnWidth: string,
) {
  const whatIfTemplateProperty = whatIfTemplate.value?.properties?.find(
    (templateProperty) => templateProperty.id === property.id,
  )
  const header = whatIfTemplateProperty?.name ?? property.id
  return {
    header,
    value: formatWhatIfScenarioProperty(property, whatIfTemplateProperty),
    width: columnWidth,
  }
}
</script>
