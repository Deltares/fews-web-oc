import { ColumnItem } from '@/components/general/ColumnItem'
import { ref, Ref, MaybeRefOrGetter, toValue, watch, watchEffect } from 'vue'

export function useMenuItemsStack(
  menuItems: MaybeRefOrGetter<ColumnItem[]>,
  activeItem: MaybeRefOrGetter<string>,
): Ref<ColumnItem[]> {
  const stack = ref<ColumnItem[]>([])

  watchEffect(() => {
    const _menuItems = toValue(menuItems)
    const _activeItem = toValue(activeItem)

    if (_activeItem !== '' && _menuItems.length > 0) {
      const root: ColumnItem = {
        id: 'rootNode',
        name: '',
        children: _menuItems,
      }
      const s = [root]

      recursiveFind(s, _activeItem)
      stack.value = s
    }
  })

  return stack
}

function recursiveFind(stack: ColumnItem[], id: string): boolean {
  const item = stack[stack.length - 1]
  if (item.id === id) return true
  if (item.children?.length) {
    for (const child of item.children) {
      stack.push(child)
      if (recursiveFind(stack, id)) {
        return true
      }
      stack.pop()
    }
  }
  return false
}
