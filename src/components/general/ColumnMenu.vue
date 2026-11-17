<template>
  <v-toolbar
    density="compact"
    class="column-menu--toolbar"
    data-testid="column-menu--toolbar"
  >
    <v-list-item
      v-if="currentLevel"
      class="column-menu--title"
      @click="onTitleClick"
    >
      <template v-slot:prepend icon>
        <v-icon>mdi-arrow-left</v-icon>
      </template>

      <slot name="menu-title" :text="currentParent?.name" :depth="currentLevel">
        <v-list-item-title>
          {{ currentParent?.name }}
        </v-list-item-title>
      </slot>
    </v-list-item>
  </v-toolbar>
  <div class="column-menu--window" data-testid="column-menu--window">
    <Transition :name="transitionName">
      <div
        v-if="currentParent"
        :key="currentParent.id"
        class="column-menu--pane"
        data-testid="column-menu--window-item"
      >
        <v-virtual-scroll
          :items="currentParent.children ?? []"
          item-key="id"
          height="100%"
        >
          <template #default="{ item: child }">
            <v-list-item
              v-if="child.children?.length"
              @click="
                (event) => {
                  onItemClick(event, child)
                }
              "
              :class="getClass(child)"
              data-testid="column-menu--item"
            >
              <template v-slot:prepend>
                <ColumnItemIcon :item="child" />
              </template>
              <v-list-item-title>{{ child.name }}</v-list-item-title>
              <template v-slot:append>
                <v-icon v-if="child.children?.length">mdi-chevron-right</v-icon>
                <v-icon v-else-if="child.appendIcon" small>{{
                  child.appendIcon
                }}</v-icon>
              </template>
            </v-list-item>
            <!-- LeafNode with external url-->
            <v-list-item
              v-else-if="child.href"
              :href="child.href"
              target="_blank"
              :class="getClass(child)"
              data-testid="column-menu--item"
            >
              <template v-slot:prepend>
                <ColumnItemIcon :item="child" leaf />
              </template>
              <v-list-item-title>{{ child.name }}</v-list-item-title>
              <template v-slot:append>
                <v-icon size="xsmall">mdi-open-in-new</v-icon>
              </template>
            </v-list-item>
            <!-- LeafNode -->
            <v-list-item
              v-else
              :to="child.to"
              :class="getClass(child)"
              data-testid="column-menu--item"
            >
              <template v-slot:prepend>
                <ColumnItemIcon :item="child" leaf />
              </template>
              <v-list-item-title>{{ child.name }}</v-list-item-title>
              <template v-slot:append>
                <v-icon v-if="child.appendIcon" small>{{
                  child.appendIcon
                }}</v-icon>
              </template>
            </v-list-item>
          </template>
        </v-virtual-scroll>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ColumnItem } from './ColumnItem'
import ColumnItemIcon from '@/components/general/ColumnItemIcon.vue'
import { useMenuItemsStack } from '../../services/useMenuItemsStack'

interface Props {
  items?: ColumnItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => {
    return []
  },
})

const emit = defineEmits(['click'])

const open = defineModel<string[]>('open', { default: () => [] })
const active = defineModel<string>('active', { default: '' })

const stack = useMenuItemsStack(
  () => props.items,
  () => active.value,
)

const currentParent = computed((): ColumnItem | undefined => {
  const s = stack.value
  return s.length > 0 ? s[s.length - 1] : undefined
})

const currentLevel = computed((): number => {
  const s = stack.value
  return s.length - 1
})

// The level that is currently on screen. It only updates after rendering, so
// during a render it still holds the previous level, which gives the direction.
const renderedLevel = ref(currentLevel.value)
watch(currentLevel, (level) => (renderedLevel.value = level), {
  flush: 'post',
})
const transitionName = computed(() =>
  currentLevel.value >= renderedLevel.value
    ? 'column-menu--forward'
    : 'column-menu--back',
)

function getClass(child: ColumnItem): string {
  return child.id === active.value ? 'primary--text v-list-item--active' : ''
}

// Set when navigating back, the stack is restored to this once the stack has
// been rebuilt because the active item was cleared.
let restoreStack: ColumnItem[] | undefined

watch(
  stack,
  () => {
    if (restoreStack) {
      const target = restoreStack
      restoreStack = undefined
      stack.value = target
      return
    }
    // When the active item is a leaf, show its parent level with the leaf
    // highlighted, instead of an empty level for the leaf itself.
    const last = stack.value.at(-1)
    if (stack.value.length > 1 && !last?.children?.length) stack.value.pop()
    open.value = stack.value.map((item: ColumnItem) => item.id)
  },
  { immediate: true },
)

function onTitleClick(): void {
  const parentStack = stack.value.slice(0, -1)
  if (parentStack.length === 0) return

  if (active.value === '') {
    stack.value = parentStack
    return
  }

  // Clearing the active item rebuilds the stack from the root, so restore the
  // parent level as part of that rebuild, before anything is rendered.
  restoreStack = parentStack
  active.value = ''
}

function onItemClick(event: Event, item: ColumnItem): void {
  const s = stack.value
  if (item.children?.length) {
    event.preventDefault()
    s.push(item)
    emit('click', event, item)
  } else {
    active.value = item.id
  }
}
</script>

<style scoped>
.column-menu--toolbar {
  flex: none;
  width: 100%;
}

.column-menu--title {
  flex: 1 1 auto;
}

/* Give the virtual scrollers a bounded height to scroll in. */
.column-menu--window {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

/* Both levels are laid out on top of each other and slide by exactly their own
   width, so the leaving and entering level border each other. */
.column-menu--pane {
  position: absolute;
  inset: 0;
}

.column-menu--forward-enter-active,
.column-menu--forward-leave-active,
.column-menu--back-enter-active,
.column-menu--back-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.column-menu--forward-enter-from,
.column-menu--back-leave-to {
  transform: translateX(100%);
}

.column-menu--forward-leave-to,
.column-menu--back-enter-from {
  transform: translateX(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .column-menu--forward-enter-active,
  .column-menu--forward-leave-active,
  .column-menu--back-enter-active,
  .column-menu--back-leave-active {
    transition-duration: 0s;
  }
}

.alert-icon {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: rgba(
    var(--v-theme-surface),
    var(--v-high-emphasis-opacity)
  );
  border-radius: 50%;
}
</style>
