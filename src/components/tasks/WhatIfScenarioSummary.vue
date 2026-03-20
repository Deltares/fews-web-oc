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

const whatIfTemplatesStore = useAvailableWhatIfTemplatesStore()

interface Props {
  whatIfScenario: WhatIfScenarioDescriptor
}
const props = defineProps<Props>()

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

const tableData = computed(() =>
  visibleProperties.value.map(convertPropertyToColumn),
)

function convertPropertyToColumn(property: ScenarioProperty) {
  const whatIfTemplateProperty = whatIfTemplate.value?.properties?.find(
    (templateProperty) => templateProperty.id === property.id,
  )
  const header = whatIfTemplateProperty?.name ?? property.id
  return {
    columns: [
      {
        header,
        value: formatWhatIfScenarioProperty(property),
      },
    ],
  }
}
</script>
