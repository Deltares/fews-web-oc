<template>
  <div class="table-container">
    <table class="data-table">
      <thead></thead>
      <tbody>
        <tr v-for="row in tableData">
          <td class="text-high-emphasis">
            {{ row.header }}
            <span class="text-medium-emphasis">
              {{ row.value }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">

interface Row {
  header: string
  value: string | undefined | null
}

interface Props {
  tableData: Row[]
}

defineProps<Props>()
</script>

<style scoped>
.table-container {
  display: flex;
  flex-direction: row;
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
  font-size: 0.75em;
}
</style>
