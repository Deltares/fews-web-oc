import { defineComponent, h, ref } from 'vue'
import type { TableData, TableSeriesData } from '@/lib/table/tableData'
import TableCellEdit from './TableCellEdit.vue'

export const Default = defineComponent({
  setup() {
    const date = new Date('2025-01-01T00:00:00.000Z')
    const item: TableData = {
      date,
      'series-1': {
        x: date,
        y: 12,
        tooltip: false,
        flagEdit: 'Reliable',
        comment: 'Initial comment',
      },
    }
    const updatedValue = ref('')

    return () =>
      h('div', [
        h(TableCellEdit, {
          id: 'series-1',
          item,
          'onUpdate:item': (updatedItem: TableData) => {
            updatedValue.value = JSON.stringify(
              updatedItem['series-1'] as Partial<TableSeriesData>,
            )
          },
        }),
        h('output', { 'data-testid': 'updated-value' }, updatedValue.value),
      ])
  },
})
