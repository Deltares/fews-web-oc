import { defineComponent, h, ref, type Component } from 'vue'
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

// The menu fills the available height, like it does in the sidebar.
function inSidebar(component: Component, props: Record<string, unknown>) {
  return h(
    'div',
    { style: 'display: flex; flex-direction: column; height: 400px' },
    [h(component, props)],
  )
}

export const RootList = defineComponent(() => {
  const active = ref('')
  const open = ref<string[]>([])
  return () =>
    inSidebar(ColumnMenu, {
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
    inSidebar(ColumnMenu, {
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
    inSidebar(ColumnMenu, {
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

export const WithActiveLeaf = defineComponent(() => {
  const active = ref('1.1')
  const open = ref<string[]>([])
  return () =>
    inSidebar(ColumnMenu, {
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

const deepItems: ColumnItem[] = [
  {
    id: 'a',
    name: 'A',
    children: [
      {
        id: 'a.b',
        name: 'A.B',
        children: [{ id: 'a.b.c', name: 'A.B.C' }],
      },
    ],
  },
]

export const WithDeepActiveLeaf = defineComponent(() => {
  const active = ref('a.b.c')
  const open = ref<string[]>([])
  return () =>
    inSidebar(ColumnMenu, {
      items: deepItems,
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
