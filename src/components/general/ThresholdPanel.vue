<template>
  <div v-if="warningLevels?.length" class="threshold-panel h-100 d-flex flex-column">
    <v-data-iterator :items=warningLevels>
      <template v-slot:default="{ items }">
        <v-list density="compact">
          <v-list-group v-for="item in items"
            :key="item.raw.id" :value="item.raw.id">
            <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
            >
              <template v-slot:prepend>
                <v-avatar start :image="item.raw.icon" rounded size="x-small"></v-avatar>
              </template>
              {{ item.raw.name }}
              <template v-slot:append>
                <v-avatar end :text="`${item.raw.count}`"></v-avatar>
              </template>
            </v-list-item>
          </template>

            <v-list-item v-for="crossing in item.raw.thresholdCrossing"
              :key="crossing.locationId"
              >
              {{ crossing.locationId }}
            </v-list-item>
          </v-list-group>
        </v-list>
      </template>
    </v-data-iterator>
  </div>
</template>

<script setup lang="ts">
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { getResourcesIconsUrl } from '@/lib/fews-config';
import { computed } from 'vue';

interface Props {
  nodeId?: string
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { thresholds: thresholdsArray } = useTopologyThresholds(baseUrl, () => props.nodeId)

const warningLevels = computed(() => {
  if (thresholdsArray.value === undefined || thresholdsArray.value.length === 0) return []
  const thresholds = thresholdsArray.value[0]
  return thresholds.aggregatedLevelThresholdWarningLevels?.map((warningLevel) => {
    return {
      name: warningLevel.name,
      id: warningLevel.id,
      count: warningLevel.count,
      icon: warningLevel.icon ? getResourcesIconsUrl(warningLevel.icon) : undefined,
      thresholdCrossing: thresholds.aggregatedLevelThresholdCrossings?.filter(
        (crossing) => crossing.warningLevelId == warningLevel.id
      )
    }
  })
})

</script>

<style scoped>
.threshold-panel {
  width: 300px;
}
</style>