<template>
  <div class="table-cell-editable">
    <input
      :ref="`${props.item.date}-${props.id}-value`"
      v-model.number="currentItem.y"
      class="table-cell-edit"
      type="number"
      placeholder="value"
      @change="editItem"
    />
    <select
      :ref="`${props.item.date}-${props.id}-flagquality`"
      class="table-cell-edit"
      v-model="currentItem.flagEdit"
      @change="editItem"
    >
      <option v-for="flagEdit in possibleFlagEdits" :key="flagEdit" :value="flagEdit">
        {{ flagEdit }}
      </option>
    </select>
    <input
      :ref="`${props.item.date}-${props.id}-comment`"
      v-model="currentItem.comment"
      class="table-cell-edit"
      type="text"
      placeholder="comment"
      @change="editItem"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableData, TableSeriesData } from '@/lib/table/tableData'
import { ref } from 'vue'

// Required for TS to enforce the exact values of the flagEdit field
const tempPossibleFlagEdits: Record<
  NonNullable<TableSeriesData['flagEdit']>,
  undefined
> = {
  Reliable: undefined,
  Doubtful: undefined,
  Unreliable: undefined,
  'Accumulation Reset': undefined,
  'Persistent Unreliable': undefined,
}
const possibleFlagEdits = Object.keys(tempPossibleFlagEdits)

interface Props {
  id: string
  item: TableData
}

const props = defineProps<Props>()

const emit = defineEmits(['update:item'])

const currentItem = ref<Partial<TableSeriesData>>({
  ...(props.item[props.id] as Partial<TableSeriesData>),
})

function editItem() {
  const updatedItem = {
    date: props.item.date,
    [props.id]: currentItem.value,
  }
  emit('update:item', updatedItem)
}
</script>

<style scoped>
.table-cell-editable {
  z-index: -1;
  width: 100%;
  display: flex;
  flex-direction: row;
  min-width: 240px;
}

.table-cell-editable input[type='checkbox'] {
  display: none;
  margin-right: 5px;
  width: 1.5em;
  border: 1px solid currentColor;
  border-radius: 2px;
  background-color: rgb(var(--v-theme-surface));
  color: currentColor;
  cursor: pointer;
}

input.table-cell-edit {
  display: flex;
  line-height: 100%;
  padding: 4px;
  min-width: 5ch;
  color: currentColor;
}
select.table-cell-edit {
  display: flex;
  line-height: 100%;
  padding: 4px;
  min-width: 16ch;
  color: currentColor;
}

.table-cell-edit::placeholder {
  opacity: 0;
}

.table-cell-editable:hover > .table-cell-edit::placeholder {
  opacity: 1;
}

select.table-cell-edit > option {
  background-color: rgb(var(--v-theme-surface));
}
</style>
