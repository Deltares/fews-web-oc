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
              <v-icon size="xsmall">{{ child.icon }}</v-icon>
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
          >
            <v-list-item-title>{{ child.name }}</v-list-item-title>
            <template v-slot:append>
              <v-icon v-if="child.children?.length">mdi-chevron-right</v-icon>
              <v-icon v-else-if="child.icon" small>{{ child.icon }}</v-icon>
            </template>
          </v-list-item>
        </template>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { ColumnItem } from './ColumnItem'
import { useMenuItemsStack } from '@/services/useMenuItemsStack'

interface Props {
  items?: ColumnItem[]
  open?: string[]
  active?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => {
    return []
  },
  open: () => [],
  active: '',
})

const emit = defineEmits(['click', 'update:active', 'update:open'])

const stack = useMenuItemsStack(
  () => props.items,
  () => props.active,
)

const currentTitle = computed((): string => {
  const s = stack.value
  const title = s.length > 0 ? s[s.length - 1].name : ''
  return title
})

const currentLevel = computed((): number => {
  const s = stack.value
  return s.length - 1
})

function getClass(child: ColumnItem): string {
  return child.id === props.active ? 'primary--text v-list-item--active' : ''
}

watch(
  stack,
  () => {
    const path = stack.value.map((item: ColumnItem) => item.id)
    emit('update:open', [...path])
  },
  { immediate: true },
)

function onTitleClick(): void {
  const s = stack.value
  if (s.length > 1) {
    s.pop()
  }
  emit('update:active', undefined)
}

function onItemClick(event: Event, item: ColumnItem): void {
  const s = stack.value
  if (item.children?.length) {
    event.preventDefault()
    s.push(item)
  } else {
    emit('update:active', item.id)
  }
  emit('click', event, item)
}
</script>
