<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu :active.sync="active" :items="items" :open.sync="open">
    </ColumnMenu>
  </Teleport>
  <div style="width: 100%; height: 100%; background-color: green">
    <MapComponent></MapComponent>
  </div>
</template>

<script setup lang="ts">
import MapComponent from '../components/map/MapComponent.vue'
import ColumnMenu from '../components/general/ColumnMenu.vue'
import { ref, onMounted } from 'vue'
import { ColumnItem } from '../components/general/ColumnItem'

interface Props {
  layerName?: string
  style?: any
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  style: '',
})

const active = ref<string[]>([])
const open = ref<string[]>([])
const items = ref<ColumnItem[]>([])

onMounted(() => {
  active.value = ['root']
  items.value = [
    {
      id: 'root',
      name: 'Layers',
      children: [
        {
          id: 'id11',
          name: 'text11',
          children: [
            {
              id: 'foo11',
              name: 'foo',
            },
          ],
        },
        {
          id: 'id12',
          name: 'text12',
          children: [
            {
              id: 'foo12',
              name: 'foo',
            },
          ],
        },
      ],
    },
  ]
})
</script>
