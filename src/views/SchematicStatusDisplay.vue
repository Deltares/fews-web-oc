<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu :active.sync="active" :items="items" :open.sync="open"/>
  </Teleport>
  <div class="container">
    <div class="ssd-container">
      <SsdComponent :src="src"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import ColumnMenu from '../components/general/ColumnMenu.vue'
import { ref, onMounted, computed } from 'vue'
import { ColumnItem } from '../components/general/ColumnItem'
import SsdComponent from '../components/ssd/SsdComponent.vue'
import { configManager } from '../services/application-config/index.ts'
import { useSsd } from '../services/useSsd/index.ts'

interface Props {
  groupId?: string
  panelId?: string
}

const props = withDefaults(defineProps<Props>(), {
  groupId: '',
  panelId: '',
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const active = ref<string[]>([])
const open = ref<string[]>([])
const time = ref('')

onMounted(() => {
  active.value = ['root']
})

const items = computed(() => {
  const result: ColumnItem[] = []
  const c = capabilities.value
  if (c !== undefined) {
    for (const displayGroup of c.displayGroups) {
      const name = displayGroup.title.replace('Overzichtsschermen ', '')
      const children = []
      for (const displayPanel of displayGroup.displayPanels) {
        children.push({
          id: displayPanel.name,
          name: displayPanel.title,
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
  return [{ id: 'root', name: 'Groups', children: result }]
})

const { capabilities, src } = useSsd(
  baseUrl,
  () => props.groupId,
  () => props.panelId,
  time,
)
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.ssd-container {
  flex: 100% 1 1;
  width: 100%;
}
</style>