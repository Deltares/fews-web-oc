<template>
  <div>
    <v-toolbar density="compact">
      <v-list-item @click="onTitleClick" v-if="currentLevel">
        <template v-slot:prepend icon>
          <v-icon>mdi-arrow-left</v-icon>
        </template>

        <slot name="menu-title" :text="currentTitle" :depth="currentLevel">
          <v-list-item-title>
            {{ currentTitle }}
          </v-list-item-title>
        </slot>
      </v-list-item>
    </v-toolbar>
    <v-window v-model="currentLevel">
      <v-window-item v-for="(item, i) in stack" v-bind:key="i">
        <template v-for="child in item.children" v-bind:key="child.id">
          <v-list-item
            v-if="child.href"
            :href="child.href"
            target="_blank"
            :class="getClass(child)"
          >
            <v-list-item-title>{{ child.name }}</v-list-item-title>
            <template v-slot:append>
              <v-icon>mdi-share</v-icon>
            </template>
          </v-list-item>
          <v-list-item
            v-else
            @click="
              (event) => {
                onItemClick(event, child)
              }
            "
            :to="child.to"
            :class="getClass(child)"
            :disabled="child.disabled"
          >
            <v-list-item-title>{{ child.name }}</v-list-item-title>
            <template v-slot:append>
              <v-tooltip v-if="item.tooltipText">
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    class="allow-disabled-hover"
                    size="x-small"
                    >{{ item.icon }}</v-icon
                  >
                </template>
                {{ item.tooltipText }}
              </v-tooltip>
              <div v-else>
                <v-icon v-if="child.children">mdi-chevron-right</v-icon>
                <v-icon v-else-if="child.icon" small>{{ child.icon }}</v-icon>
              </div>
            </template>
          </v-list-item>
        </template>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { ColumnItem } from './ColumnItem'

interface Props {
  items?: ColumnItem[]
  open?: string[]
  active?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => {
    return []
  },
  open: () => [],
  active: () => [],
})

const stack = ref<ColumnItem[]>([])
let path: string[] = []

const emit = defineEmits(['click', 'update:active', 'update:open'])

onMounted((): void => {
  updateStack()
})

const currentTitle = computed((): string => {
  const s = stack.value
  const title = s.length > 0 ? s[s.length - 1].name : ''
  return title
})

const currentLevel = computed((): number => {
  const s = stack.value
  return s.length - 1
})

watch(
  () => props.items,
  () => {
    updateStack()
  },
)

function getClass(child: ColumnItem): string {
  return child.id === props.active[0] ? 'primary--text v-list-item--active' : ''
}

function onTitleClick(): void {
  const s = stack.value
  if (s.length > 1) {
    s.pop()
    path.pop()
  }
  emit('update:active', [])
  emit('update:open', [...path, ...props.open])
}

function onItemClick(event: Event, item: ColumnItem): void {
  const s = stack.value
  if (item.children?.length) {
    event.preventDefault()
    s.push(item)
    path.push(item.id)
    emit('update:open', [...path, ...props.open])
  } else {
    emit('update:active', [item.id])
  }
  emit('click', event, item)
}

function updateStack(): void {
  const root: ColumnItem = {
    id: 'rootNode',
    name: '',
    children: [...props.items],
  }
  const s = [root]
  recursiveFind(s, props.active[0])
  stack.value = s
  path = s.map((item) => item.id)
  emit('update:open', [...path, ...props.open])
}

function recursiveFind(stack: ColumnItem[], id: string): boolean {
  const item = stack[stack.length - 1]
  if (item.id === id) return true
  if (item.children?.length) {
    for (const child of item.children) {
      stack.push(child)
      if (recursiveFind(stack, id)) {
        if (child.children === undefined) stack.pop()
        return true
      }
      stack.pop()
    }
  }
  return false
}
</script>

<style>
.allow-disabled-hover {
  pointer-events: auto;
}
</style>
