import { ref, nextTick } from 'vue'
import { useMenuItemsStack } from './index.js'
import { ColumnItem } from '@/components/general/ColumnItem.js'
import { test, expect } from 'vitest'

const items: ColumnItem[] = [
  {
    id: '1',
    name: 'Item 1',
    children: [
      {
        id: '1.1',
        name: 'Item 1.1',
      },
      {
        id: '1.2',
        name: 'Item 1.2',
      },
    ],
  },
  {
    id: '2',
    name: 'Item 2',
  },
  {
    id: '3',
    name: 'Item 3',
  },
]

test('should react to active changes', async () => {
  const active = ref('1')
  const stack = useMenuItemsStack(() => items, active)
  expect(stack.value.length).toBe(2)

  active.value = '1'
  await nextTick()

  expect(stack.value.length).toBe(2)

  active.value = '1.1'
  await nextTick()
  expect(stack.value.length).toBe(3)
})
