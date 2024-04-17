<template v-else>
  <span v-if="tableSeriesDatum" class="table-cell-with-flag">
    <div
      class="circle"
      :class="`flag-background-color--${tableSeriesDatum.flag}`"
    ></div>
    <span class="value">
      {{ tableSeriesDatum.y }}
    </span>
    <span
      v-if="tableSeriesDatum.comment"
      class="comment-icon mdi mdi-comment-outline"
    ></span>
  </span>
</template>

<script setup lang="ts">
import type { TableData, TableSeriesData } from '@/lib/table/tableData'
import { computed } from 'vue'

interface Props {
  id: string
  item: TableData
}

const props = defineProps<Props>()

function isTableSeriesData(
  item: TableData[keyof TableData],
): item is Partial<TableSeriesData> {
  return (item as Partial<TableSeriesData>).y !== undefined
}

const tableSeriesDatum = computed(() => {
  if (
    props.item[props.id] !== undefined &&
    isTableSeriesData(props.item[props.id])
  ) {
    return props.item[props.id] as Partial<TableSeriesData>
  }
  return undefined
})
</script>

<style scoped>
.circle {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin: auto 2px;
}

.table-cell-with-flag {
  z-index: -1;
  width: 100%;
  display: inline-block;
  min-width: 80px;
}

.comment-icon {
  margin: 2px;
  color: #9e9e9e;
}

.value {
  display: inline-block;
  line-height: 100%;
  min-width: 10px;
}
</style>
