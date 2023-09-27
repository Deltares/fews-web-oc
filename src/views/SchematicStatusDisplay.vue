<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu :active.sync="active" :items="items" :open.sync="open" />
  </Teleport>
  <div class="container">
    <SsdComponent :src="src" />
    <DateTimeSlider
      v-model:selectedDate="selectedDate"
      v-model:doFollowNow="doFollowNow"
      :dates="dates"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

import { configManager } from '../services/application-config/index.ts'
import type { ColumnItem } from '../components/general/ColumnItem'

import { useSsd } from '../services/useSsd/index.ts'

import ColumnMenu from '../components/general/ColumnMenu.vue'
import DateTimeSlider from '../components/general/DateTimeSlider.vue'
import SsdComponent from '../components/ssd/SsdComponent.vue'

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

const selectedDate = ref(new Date())
const doFollowNow = ref(false)

onMounted(() => {
  active.value = ['root']
})

const selectedDateString = computed(
  () => {
    const dateString = selectedDate.value.toISOString()
    return dateString.substring(0, 19) + 'Z'
  }
)
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

const { capabilities, src, dates } = useSsd(
  baseUrl,
  () => props.groupId,
  () => props.panelId,
  selectedDateString,
)
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
</style>
