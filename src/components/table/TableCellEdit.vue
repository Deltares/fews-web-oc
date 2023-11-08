<template>
  <div class="table-cell-editable">
    <input
      :ref="`${props.item.date}-${id}-value`"
      v-model.number="(props.item[id] as Partial<TableSeriesData>).value"
      class="table-cell-input"
      type="number"
    />
    <select
      :ref="`${props.item.date}-${id}-flagquality`"
      class="table-cell-input"
    >
      <option
        v-for="flagQuality in store.flagQualities"
        :key="flagQuality as string"
        :value="flagQuality"
      >
        {{ flagQuality }}
      </option>
    </select>
    <input
      :ref="`${props.item.date}-${id}-comment`"
      v-model="(props.item[id] as Partial<TableSeriesData>).comment"
      class="table-cell-input"
      type="text"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableSeriesData } from '@/lib/table/createTableData'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'

interface Props {
  id: string
  item: Record<string, string | Partial<TableSeriesData>>
}

const props = defineProps<Props>()

const store = useFewsPropertiesStore()
</script>

<style scoped>
.table-cell-editable {
  z-index: -1;
  width: 100%;
  display: flex;
  flex-direction: row;
  min-width: 240px;
}

.table-cell-input {
  display: flex;
  line-height: 100%;
  min-width: 80px;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}
</style>
