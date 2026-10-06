<template>
  <div class="table-cell-editable">
    <!-- Edge does not respect lang="en-US" as such to not have ',' as decimal separator we need type="text" -->
    <label class="table-cell-editable__label" :for="valueInputId">
      Value for {{ props.id }} at {{ props.item.date.toISOString() }}
    </label>
    <input
      :id="valueInputId"
      v-model.number="currentItem.y"
      class="table-cell-edit table-cell-edit--value"
      type="text"
      inputmode="decimal"
      placeholder="value"
      @input="editItem"
    />
    <label class="table-cell-editable__label" :for="flagInputId">
      Flag quality for {{ props.id }} at {{ props.item.date.toISOString() }}
    </label>
    <select
      :id="flagInputId"
      class="table-cell-edit"
      v-model="currentItem.flagEdit"
      @change="editItem"
    >
      <option
        v-for="flagEdit in possibleFlagEdits"
        :key="flagEdit"
        :value="flagEdit"
      >
        {{ flagEdit }}
      </option>
    </select>
    <label class="table-cell-editable__label" :for="commentInputId">
      Comment for {{ props.id }} at {{ props.item.date.toISOString() }}
    </label>
    <input
      :id="commentInputId"
      v-model="currentItem.comment"
      class="table-cell-edit table-cell-edit--comment"
      type="text"
      placeholder="comment"
      @input="editItem"
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
  'Persistent Unreliable': undefined,
  'Accumulation Reset': undefined,
}
const possibleFlagEdits = Object.keys(tempPossibleFlagEdits)

interface Props {
  id: string
  item: TableData
}

const props = defineProps<Props>()

const emit = defineEmits(['update:item'])
const safeSeriesId = props.id.replace(/[^a-zA-Z0-9_-]/g, '-')
const inputIdPrefix = `table-cell-${props.item.date.getTime()}-${safeSeriesId}`
const valueInputId = `${inputIdPrefix}-value`
const flagInputId = `${inputIdPrefix}-flag-quality`
const commentInputId = `${inputIdPrefix}-comment`

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
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  width: max-content;
  max-width: 100%;
  min-width: 0;
}

.table-cell-editable__label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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

.table-cell-edit {
  box-sizing: border-box;
  display: block;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 28px;
  padding: 3px 6px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background-color: rgb(var(--v-theme-surface));
  color: currentColor;
  font: inherit;
  line-height: 20px;
  transition:
    border-color 120ms ease,
    background-color 120ms ease;
}

.table-cell-edit:hover:not(:focus-visible) {
  border-color: rgba(var(--v-theme-on-surface), 0.6);
}

.table-cell-edit:focus-visible {
  border-color: rgb(var(--v-theme-primary));
  outline: 2px solid rgb(var(--v-theme-primary)) !important;
  outline-offset: 1px !important;
}

input.table-cell-edit--value {
  width: 8ch;
}

input.table-cell-edit--comment {
  width: 12ch;
}

select.table-cell-edit {
  width: 22ch;
  max-width: 22ch;
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
