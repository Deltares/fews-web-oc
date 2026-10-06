<template>
  <div class="table-cell-editable">
    <!-- Edge does not respect lang="en-US" as such to not have ',' as decimal separator we need type="text" -->
    <label class="table-cell-editable__label" :for="valueInputId">
      Value for {{ props.id }} at {{ props.item.date.toISOString() }}
    </label>
    <input
      :id="valueInputId"
      :data-edit-date="props.item.date.toISOString()"
      :data-edit-series-id="props.id"
      data-edit-field="y"
      v-model.number="currentItem.y"
      class="table-cell-edit table-cell-edit--value"
      :class="{
        'table-cell-edit--column-focused': props.focusedField === 'y',
      }"
      type="text"
      inputmode="decimal"
      placeholder="value"
      @input="editItem('y')"
      @focus="emit('focus-field', 'y')"
      @blur="emit('focus-field', undefined)"
    />
    <label class="table-cell-editable__label" :for="flagInputId">
      Flag quality for {{ props.id }} at {{ props.item.date.toISOString() }}
    </label>
    <select
      :id="flagInputId"
      :data-edit-date="props.item.date.toISOString()"
      :data-edit-series-id="props.id"
      data-edit-field="flagEdit"
      class="table-cell-edit"
      :class="{
        'table-cell-edit--column-focused': props.focusedField === 'flagEdit',
      }"
      v-model="currentItem.flagEdit"
      @change="editItem('flagEdit')"
      @focus="emit('focus-field', 'flagEdit')"
      @blur="emit('focus-field', undefined)"
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
      :data-edit-date="props.item.date.toISOString()"
      :data-edit-series-id="props.id"
      data-edit-field="comment"
      v-model="currentItem.comment"
      class="table-cell-edit table-cell-edit--comment"
      :class="{
        'table-cell-edit--column-focused': props.focusedField === 'comment',
      }"
      type="text"
      placeholder="comment"
      @input="editItem('comment')"
      @focus="emit('focus-field', 'comment')"
      @blur="emit('focus-field', undefined)"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  TableData,
  TableSeriesData,
  TableSeriesField,
} from '@/lib/table/tableData'
import { ref, watch } from 'vue'

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
  focusedField?: TableSeriesField
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:item': [item: TableData, field: TableSeriesField]
  'focus-field': [field: TableSeriesField | undefined]
}>()
const safeSeriesId = props.id.replace(/[^a-zA-Z0-9_-]/g, '-')
const inputIdPrefix = `table-cell-${props.item.date.getTime()}-${safeSeriesId}`
const valueInputId = `${inputIdPrefix}-value`
const flagInputId = `${inputIdPrefix}-flag-quality`
const commentInputId = `${inputIdPrefix}-comment`

const currentItem = ref<Partial<TableSeriesData>>({
  ...(props.item[props.id] as Partial<TableSeriesData>),
})

watch(
  () => props.item[props.id],
  (value) => {
    currentItem.value =
      value instanceof Date ? {} : { ...(value as Partial<TableSeriesData>) }
  },
)

function editItem(field: TableSeriesField) {
  const updatedItem = {
    date: props.item.date,
    [props.id]: currentItem.value,
  }
  emit('update:item', updatedItem, field)
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

.table-cell-edit--column-focused {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
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
