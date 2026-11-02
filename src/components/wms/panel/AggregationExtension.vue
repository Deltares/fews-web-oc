<template>
  <InformationPanelExtension
    v-model="selectedAggregationLabel"
    :items="aggregations"
    value-key="id"
    text-key="shortLabel"
    icon-key="icon"
    active-prepend-icon="mdi-clock-end"
  >
    <template #tooltip="{ item }">
      <strong>{{ item.type }} {{ item.id }}</strong>
      <div>{{ toDateRangeString(item.startDate, item.endDate) }}</div>
      <KeyboardHint
        :keys="['←', '→']"
        :label="t('wms.previousNext')"
        class="pt-2"
      />
    </template>
  </InformationPanelExtension>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import KeyboardHint from '@/components/general/KeyboardHint.vue'

import { type AggregationItem } from '@/lib/aggregation'
import { toDateRangeString } from '@/lib/date'

import InformationPanelExtension from './InformationPanelExtension.vue'

interface Props {
  aggregations: AggregationItem[]
}
defineProps<Props>()

const { t } = useI18n()

const selectedAggregationLabel = defineModel<string | null>(
  'selectedAggregationLabel',
  { required: true },
)
</script>
