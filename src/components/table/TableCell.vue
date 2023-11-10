<template v-else>
  <span
    v-if="props.item[id]"
    class="table-cell-with-flag"
  >
    <div
      class="circle"
      :class="`flag-background-color--${(props.item[id] as Partial<TableSeriesData>).flag}`"
    ></div>
    <span class="value">{{ (props.item[id] as Partial<TableSeriesData>).y }}</span>
    <span
      v-if="(props.item[id] as Partial<TableSeriesData>).comment"
      class="comment-icon mdi mdi-comment-outline"
    ></span>
  </span>
</template>

<script setup lang="ts">
import type { TableSeriesData } from '@/lib/table/tableData'

interface Props {
  id: string
  item: Record<string, Date | Partial<TableSeriesData>>
}

const props = defineProps<Props>()

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