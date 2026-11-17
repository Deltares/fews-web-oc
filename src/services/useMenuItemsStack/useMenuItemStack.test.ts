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
  expect(stack.value).toHaveLength(2)

  active.value = '1'
  await nextTick()

  expect(stack.value).toHaveLength(2)

  active.value = '1.1'
  await nextTick()
  expect(stack.value).toHaveLength(3)
})

test('should keep only the path to a later child', () => {
  const stack = useMenuItemsStack(items, '1.2')

  expect(stack.value.map((item) => item.id)).toEqual(['rootNode', '1', '1.2'])
})

test('should remove failed branches before finding a later root item', () => {
  const stack = useMenuItemsStack(items, '3')

  expect(stack.value.map((item) => item.id)).toEqual(['rootNode', '3'])
})

test('should keep only the root when the active item is not found', () => {
  const stack = useMenuItemsStack(items, 'missing')

  expect(stack.value.map((item) => item.id)).toEqual(['rootNode'])
})
