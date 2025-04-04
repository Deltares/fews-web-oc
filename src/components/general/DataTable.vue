<template>
  <div class="table-container">
    <table v-for="table in filteredTableData" class="data-table">
      <thead>
        <tr>
          <th
            v-for="column in table.filteredColumns"
            class="font-weight-medium"
          >
            {{ column.header }}
            <span v-if="column.subHeader" class="text-medium-emphasis">
              {{ column.subHeader }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td
            v-for="column in table.filteredColumns"
            class="text-medium-emphasis"
          >
            {{ column.value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Column {
  header: string
  subHeader?: string
  value: string | undefined | null
}

interface Table {
  columns: Column[]
}

interface Props {
  tableData: Table[]
}

const props = defineProps<Props>()

const filteredTableData = computed(() =>
  props.tableData
    .map((table) => ({
      ...table,
      filteredColumns: table.columns.filter((c) => !!c.value),
    }))
    .filter((table) => table.filteredColumns.length > 0),
)
</script>

<style scoped>
.table-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.data-table {
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  text-align: left;
  padding-right: 10px;
}

.data-table td {
  padding-bottom: 5px;
}
</style>
