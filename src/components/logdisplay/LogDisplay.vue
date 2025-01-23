<template>
  <OperatorLog v-if="logDisplay" :logDisplay />
  <div v-else>
    <v-alert type="warning" class="ma-3">No logs display available</v-alert>
  </div>
</template>

<script setup lang="ts">
import OperatorLog from '@/components/logdisplay/OperatorLog.vue'
import { useLogDisplaysStore } from '@/stores/logDisplays'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const logDisplaysStore = useLogDisplaysStore()
logDisplaysStore.fetch()

const logDisplay = computed(() => {
  const id = props.topologyNode?.logDisplay?.id
  return logDisplaysStore.getById(id)
})
</script>
