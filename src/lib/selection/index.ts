import { toRaw } from 'vue'
import type { SelectStrategy } from 'vuetify'

/**
 * A selection strategy that cascades selection state to all children.
 * Selecting a parent selects all its children, and deselecting a parent
 * deselects all its children.
 */
export const cascadeStrategy: SelectStrategy = {
  select: ({ id, value, selected, children }) => {
    const items = [id]

    while (items.length) {
      const item = items.shift()

      selected.set(toRaw(item), value ? 'on' : 'off')

      if (children.has(item)) {
        items.push(...children.get(item)!)
      }
    }

    return selected
  },
  in: (v) => {
    const map = new Map()

    for (const id of v ?? []) {
      map.set(toRaw(id), 'on')
    }

    return map
  },
  out: (v) => {
    const arr = []

    for (const [key, value] of v.entries()) {
      if (value === 'on') arr.push(key)
    }

    return arr
  },
}
