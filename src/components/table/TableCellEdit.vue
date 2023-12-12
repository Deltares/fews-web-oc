<template>
  <div class="table-cell-editable">
    <input
      :ref="`${props.item.date}-${props.id}-value`"
      v-model.number="currentItem.y"
      class="table-cell-edit"
      type="number"
      placeholder="value"
      @change="(event) => editValue(event, currentItem.y)"
    />
    <select
      :ref="`${props.item.date}-${props.id}-flagquality`"
      class="table-cell-edit"
      v-model="currentItem.flagQuality"
      @change="(event) => editFlagQuality(event)"
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
import type { TableSeriesData } from '@/lib/table/tableData'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'
import type { TimeSeriesEvent } from '@deltares/fews-pi-requests'
import { ref } from 'vue'

interface Props {
  id: string
  item: Record<string, Date | Partial<TableSeriesData>>
}

const props = defineProps<Props>()

const emit = defineEmits(['update:item'])

const currentItem = ref<Partial<TableSeriesData>>({
  ...(props.item[props.id] as Partial<TableSeriesData>),
})

const store = useFewsPropertiesStore()

function editItem() {
  const flag = store.flags?.find(
    (flag) =>
      flag.source === currentItem.value.flagOrigin &&
      flag.quality === currentItem.value.flagQuality,
  )
  if (flag) {
    currentItem.value.flag = flag.flag as TimeSeriesEvent['flag']
  }
  const updatedItem = {
    date: props.item.date,
    [props.id]: currentItem.value,
  }
  emit('update:item', updatedItem)
}

function editValue(event: Event, value: number | null | undefined) {
  const oldItem = props.item[props.id] as Partial<TableSeriesData>
  if (oldItem.y === null || oldItem.y === undefined) {
    // User adds new value
    currentItem.value.flagOrigin = 'COMPLETED'
    currentItem.value.flagQuality = 'RELIABLE'
  } else {
    // User changes existing value
    currentItem.value.flagOrigin = 'CORRECTED'
  }
  currentItem.value.flagSource = 'MAN'
  editItem()
}

function editFlagQuality(event: Event) {
  currentItem.value.flagSource = 'MAN'
  editItem()
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
  min-width: 12ch;
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
