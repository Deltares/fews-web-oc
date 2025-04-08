<template>
  <Teleport to="#web-oc-sidebar-target" v-if="route.meta?.sidebar">
    <HierarchicalMenu
      v-model:active="active"
      v-model:open="open"
      :type="menuType"
      :items="items"
    />
  </Teleport>
  <SchematicStatusDisplay
    :groupId="props.groupId"
    :panelId="props.panelId"
    :objectId="props.objectId"
    @navigate="onNavigate"
  />
</template>

<script setup lang="ts">
import type {
  SsdDisplayGroup,
  SsdDisplayPanel,
} from '@deltares/fews-ssd-requests'
import { ref, onMounted, computed, watch } from 'vue'
import { RouteLocationNormalized, useRoute, useRouter } from 'vue-router'

import { useUserSettingsStore } from '@/stores/userSettings.ts'

import { configManager } from '../services/application-config/index.ts'
import type { ColumnItem } from '../components/general/ColumnItem'

import { useSsd } from '../services/useSsd/index.ts'

import HierarchicalMenu from '@/components/general/HierarchicalMenu.vue'
import SchematicStatusDisplay from '@/components/ssd/SchematicStatusDisplay.vue'

interface Props {
  groupId?: string
  panelId?: string
  objectId?: string
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const settings = useUserSettingsStore()
const route = useRoute()
const router = useRouter()

const props = withDefaults(defineProps<Props>(), {
  groupId: '',
  panelId: '',
  objectId: '',
})

const active = ref<string | undefined>(undefined)
const open = ref<string[]>([])

const selectedDate = ref<Date>(new Date())

onMounted(() => {
  onGroupIdChange()
  onPanelIdChange()
})

const menuType = computed(() => {
  const configured = settings.get('ui.hierarchical-menu-style')?.value as string
  return configured ?? 'auto'
})

const selectedDateString = computed(() => {
  if (selectedDate.value === undefined) return ''
  const dateString = selectedDate.value.toISOString()
  return dateString.substring(0, 19) + 'Z'
})
const items = computed(() => {
  const result: ColumnItem[] = []
  if (capabilities.value !== undefined) {
    for (const displayGroup of capabilities.value.displayGroups) {
      // TODO: this should not be hard-coded in here, but should fixed in the configuration?
      const name = displayGroup.title.replace('Overzichtsschermen ', '')
      const children = []
      for (const displayPanel of displayGroup.displayPanels) {
        children.push({
          id: displayPanel.name,
          name: displayPanel.title ?? '',
          to: {
            name: 'SchematicStatusDisplay',
            params: {
              panelId: displayPanel.name,
              groupId: displayGroup.name,
            },
          },
        })
      }
      result.push({ id: displayGroup.name, name, children })
    }
  }
  return result
})

// Make sure the appropriate group in the menu is open, and the panel is selected.
watch(() => props.groupId, onGroupIdChange)
watch(() => props.panelId, onPanelIdChange)

const { capabilities } = useSsd(
  baseUrl,
  () => props.panelId,
  selectedDateString,
)

// If the capabilities changes, make sure our currently selected groupId and panelId are still
// valid. If invalid or empty, select the first group and panel.
watch(capabilities, () => {
  let group: SsdDisplayGroup | null = null
  let panel: SsdDisplayPanel | null = null

  if (props.groupId !== '' && capabilities.value) {
    group =
      capabilities.value.displayGroups.find(
        (group) => group.name === props.groupId,
      ) ?? null
  }
  if (props.panelId !== '' && group) {
    panel =
      group.displayPanels.find((panel) => panel.name === props.panelId) ?? null
  }

  if (!group || !panel) {
    // Update the route with the first member of capabilities, but only if it exists.
    const newGroupId = capabilities.value?.displayGroups[0].name
    const newPanelId =
      capabilities.value?.displayGroups[0]?.displayPanels[0]?.name
    if (newGroupId && newPanelId) {
      router.push({
        name: 'SchematicStatusDisplay',
        params: { groupId: newGroupId, panelId: newPanelId },
        query: route.query,
      })
    }
  }
})

function onGroupIdChange(): void {
  open.value[1] = props.groupId
}

function onPanelIdChange(): void {
  active.value = props.panelId
}

function onNavigate(to: RouteLocationNormalized) {
  const name = route.path.startsWith('/embed')
    ? `Embed/${String(to.name)}`
    : to.name

  switch (to.name) {
    case 'SSDTimeSeriesDisplay':
    case 'SchematicStatusDisplay':
      router.push({
        name,
        params: { ...to.params },
        query: route.query,
      })
      break
    default:
      console.warn(`Unknown route name: ${String(to.name)}`)
  }
}
</script>
