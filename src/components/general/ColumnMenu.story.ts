import { defineComponent, h, ref } from 'vue'
import ColumnMenu from './ColumnMenu.vue'
import type { ColumnItem } from './ColumnItem'

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

export const RootList = defineComponent(() => {
  const active = ref('')
  const open = ref<string[]>([])
  return () =>
    h(ColumnMenu, {
      items,
      active: active.value,
      'onUpdate:active': (v: string) => {
        active.value = v
      },
      open: open.value,
      'onUpdate:open': (v: string[]) => {
        open.value = v
      },
    })
})

export const WithActive = defineComponent(() => {
  const active = ref('1')
  const open = ref<string[]>([])
  return () =>
    h(ColumnMenu, {
      items,
      active: active.value,
      'onUpdate:active': (v: string) => {
        active.value = v
      },
      open: open.value,
      'onUpdate:open': (v: string[]) => {
        open.value = v
      },
    })
})

export const Interactive = defineComponent(() => {
  const active = ref('')
  const open = ref<string[]>([])
  return () =>
    h(ColumnMenu, {
      items,
      active: active.value,
      'onUpdate:active': (v: string) => {
        active.value = v
      },
      open: open.value,
      'onUpdate:open': (v: string[]) => {
        open.value = v
      },
      onClick: (event: Event, item: ColumnItem) => {
        active.value = item.id
      },
    })
})
